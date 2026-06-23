import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RATING_WINDOW_DAYS = 14;

// POST — create a trade confirmation (rating + optional comment)
// Gated behind both trade completions
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Check ban status
  const { data: banProfile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  if (banProfile?.is_banned) {
    return NextResponse.json(
      { error: "Your account has been banned." },
      { status: 403 }
    );
  }

  let body: {
    listingId?: string;
    rating?: number;
    comment?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { listingId, rating, comment } = body;

  if (!listingId) {
    return NextResponse.json(
      { error: "Listing ID is required." },
      { status: 400 }
    );
  }

  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json(
      { error: "Rating must be an integer from 1 to 5." },
      { status: 400 }
    );
  }

  if (comment && comment.length > 500) {
    return NextResponse.json(
      { error: "Comment must be 500 characters or fewer." },
      { status: 400 }
    );
  }

  // Get the listing
  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id, status")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 }
    );
  }

  // Require an accepted offer — use offerer_id for counterparty identification
  const { data: acceptedOffer } = await supabase
    .from("offers")
    .select("id, offerer_id")
    .eq("listing_id", listingId)
    .eq("status", "accepted")
    .limit(1)
    .maybeSingle();

  if (!acceptedOffer) {
    return NextResponse.json(
      { error: "An offer must be accepted before rating." },
      { status: 400 }
    );
  }

  // Verify the user is one of the two trade parties
  const isOwner = listing.user_id === user.id;
  const isBuyer = acceptedOffer.offerer_id === user.id;

  if (!isOwner && !isBuyer) {
    return NextResponse.json(
      { error: "You must be involved in this trade to rate." },
      { status: 403 }
    );
  }

  // Gate: both parties must have completed the trade before rating
  const { data: completions } = await supabase
    .from("trade_completions")
    .select("user_id, status, created_at")
    .eq("listing_id", listingId);

  const validCompletions = (completions || []).filter(
    (c) => c.status === "completed" || c.status === "auto_completed"
  );

  if (validCompletions.length < 2) {
    return NextResponse.json(
      { error: "Both parties must complete the trade before rating." },
      { status: 400 }
    );
  }

  // Check if any dispute is active
  const hasDispute = (completions || []).some((c) => c.status === "disputed");
  if (hasDispute) {
    return NextResponse.json(
      { error: "Cannot rate while a trade dispute is active." },
      { status: 400 }
    );
  }

  // Check 14-day rating window
  const latestCompletion = validCompletions.reduce((latest, c) =>
    new Date(c.created_at) > new Date(latest.created_at) ? c : latest
  );
  const windowEnd = new Date(latestCompletion.created_at);
  windowEnd.setDate(windowEnd.getDate() + RATING_WINDOW_DAYS);

  if (new Date() > windowEnd) {
    return NextResponse.json(
      { error: "The 14-day rating window has expired." },
      { status: 400 }
    );
  }

  // Determine the confirmed_user_id (the counterparty)
  const confirmedUserId = isOwner
    ? acceptedOffer.offerer_id
    : listing.user_id;

  // Check for existing confirmation
  const { data: existing } = await supabase
    .from("trade_confirmations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("confirmer_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You have already rated this trade." },
      { status: 409 }
    );
  }

  // Insert the confirmation
  const { error: insertError } = await supabase
    .from("trade_confirmations")
    .insert({
      listing_id: listingId,
      confirmer_id: user.id,
      confirmed_user_id: confirmedUserId,
      rating,
      comment: comment?.trim() || null,
    });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to create rating." },
      { status: 500 }
    );
  }

  // Update the confirmed user's reputation
  await updateReputation(supabase, confirmedUserId);

  return NextResponse.json({ success: true }, { status: 201 });
}

// GET — get confirmations for a listing or user
// For listing queries: implements double-blind reveal logic
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId");
  const userId = url.searchParams.get("userId");

  if (listingId) {
    // Get the current user (for double-blind logic)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("trade_confirmations")
      .select(
        "*, confirmer:profiles!trade_confirmations_confirmer_id_fkey(username)"
      )
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to load confirmations." },
        { status: 500 }
      );
    }

    const confirmations = data || [];

    // Double-blind reveal logic:
    // Ratings are revealed when:
    // 1. Both parties have rated, OR
    // 2. The 14-day rating window has expired
    const bothRated = confirmations.length >= 2;

    let windowExpired = false;
    if (!bothRated) {
      // Check if the rating window has expired
      const { data: completions } = await supabase
        .from("trade_completions")
        .select("created_at, status")
        .eq("listing_id", listingId);

      const validCompletions = (completions || []).filter(
        (c) => c.status === "completed" || c.status === "auto_completed"
      );

      if (validCompletions.length >= 2) {
        const latestCompletion = validCompletions.reduce((latest, c) =>
          new Date(c.created_at) > new Date(latest.created_at) ? c : latest
        );
        const windowEnd = new Date(latestCompletion.created_at);
        windowEnd.setDate(windowEnd.getDate() + RATING_WINDOW_DAYS);
        windowExpired = new Date() > windowEnd;
      }
    }

    const revealed = bothRated || windowExpired;

    // Apply double-blind: if not revealed, redact the other party's rating
    const result = confirmations.map((c) => {
      if (revealed) {
        return { ...c, revealed: true };
      }
      // Show own rating, redact others
      if (user && c.confirmer_id === user.id) {
        return { ...c, revealed: true };
      }
      return {
        ...c,
        rating: null,
        comment: null,
        confirmer: null,
        revealed: false,
      };
    });

    return NextResponse.json(result);
  }

  if (userId) {
    // User profile reviews — always shown (these are received ratings, already public)
    const { data, error } = await supabase
      .from("trade_confirmations")
      .select(
        "*, confirmer:profiles!trade_confirmations_confirmer_id_fkey(username), listings(id, title, type)"
      )
      .eq("confirmed_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to load reviews." },
        { status: 500 }
      );
    }

    // For user profile, check reveal status per listing
    const reviews = data || [];
    const revealedReviews = await Promise.all(
      reviews.map(async (review) => {
        // Check if both parties rated this listing
        const { count } = await supabase
          .from("trade_confirmations")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", review.listing_id);

        if (count && count >= 2) {
          return { ...review, revealed: true };
        }

        // Check if rating window expired
        const { data: completions } = await supabase
          .from("trade_completions")
          .select("created_at, status")
          .eq("listing_id", review.listing_id);

        const validCompletions = (completions || []).filter(
          (c: { status: string }) =>
            c.status === "completed" || c.status === "auto_completed"
        );

        if (validCompletions.length >= 2) {
          const latestCompletion = validCompletions.reduce(
            (latest: { created_at: string }, c: { created_at: string }) =>
              new Date(c.created_at) > new Date(latest.created_at) ? c : latest
          );
          const windowEnd = new Date(latestCompletion.created_at);
          windowEnd.setDate(windowEnd.getDate() + RATING_WINDOW_DAYS);
          if (new Date() > windowEnd) {
            return { ...review, revealed: true };
          }
        }

        // Not revealed yet — redact
        return {
          ...review,
          rating: null,
          comment: null,
          confirmer: null,
          revealed: false,
        };
      })
    );

    return NextResponse.json(revealedReviews);
  }

  return NextResponse.json(
    { error: "Provide listingId or userId parameter." },
    { status: 400 }
  );
}

async function updateReputation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  // Calculate average rating and trade count for this user
  const { data: confirmations } = await supabase
    .from("trade_confirmations")
    .select("rating")
    .eq("confirmed_user_id", userId);

  if (!confirmations || confirmations.length === 0) return;

  const totalRating = confirmations.reduce(
    (sum: number, c: { rating: number }) => sum + c.rating,
    0
  );
  const avgRating = Math.round((totalRating / confirmations.length) * 10); // Store as int * 10

  await supabase
    .from("profiles")
    .update({
      reputation_score: avgRating,
      completed_trades: confirmations.length,
    })
    .eq("id", userId);
}
