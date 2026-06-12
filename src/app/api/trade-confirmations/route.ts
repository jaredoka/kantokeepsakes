import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST — create a trade confirmation (rating + optional comment)
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

  // Require an accepted offer before trade confirmation
  const { data: acceptedOffer } = await supabase
    .from("offers")
    .select("id")
    .eq("listing_id", listingId)
    .eq("status", "accepted")
    .limit(1)
    .maybeSingle();

  if (!acceptedOffer) {
    return NextResponse.json(
      { error: "An offer must be accepted before confirming a trade." },
      { status: 400 }
    );
  }

  // Verify the user is involved in this listing (either the owner or has a conversation about it)
  const isOwner = listing.user_id === user.id;

  if (!isOwner) {
    // Check if this user has a conversation for this listing (meaning they're the buyer/interested party)
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("participant_2", user.id)
      .limit(1)
      .single();

    if (!conv) {
      return NextResponse.json(
        { error: "You must be involved in this trade to confirm it." },
        { status: 403 }
      );
    }
  }

  // Determine the confirmed_user_id (the other party)
  let confirmedUserId: string;
  if (isOwner) {
    // Owner confirms the buyer — find who they traded with via conversation
    const { data: conv } = await supabase
      .from("conversations")
      .select("participant_2")
      .eq("listing_id", listingId)
      .limit(1)
      .single();

    if (!conv) {
      return NextResponse.json(
        { error: "No trade partner found for this listing." },
        { status: 400 }
      );
    }
    confirmedUserId = conv.participant_2;
  } else {
    // Buyer confirms the seller (listing owner)
    confirmedUserId = listing.user_id;
  }

  // Check for existing confirmation
  const { data: existing } = await supabase
    .from("trade_confirmations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("confirmer_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You have already confirmed this trade." },
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
      { error: "Failed to create confirmation." },
      { status: 500 }
    );
  }

  // Update the confirmed user's reputation
  await updateReputation(supabase, confirmedUserId);

  // Check if both parties have confirmed — if so, mark listing as sold
  const { count: confirmCount } = await supabase
    .from("trade_confirmations")
    .select("*", { count: "exact", head: true })
    .eq("listing_id", listingId);

  if (confirmCount && confirmCount >= 2) {
    await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", listingId);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

// GET — get confirmations for a listing or user
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId");
  const userId = url.searchParams.get("userId");

  if (listingId) {
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

    return NextResponse.json(data || []);
  }

  if (userId) {
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

    return NextResponse.json(data || []);
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
