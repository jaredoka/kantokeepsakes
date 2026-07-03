import { NextRequest, NextResponse, after } from "next/server";
import { getAuthUser } from "@/lib/supabase/api-auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { notifyUser } from "@/lib/email";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST — complete or dispute a trade
export async function POST(request: NextRequest) {
  const { user, supabase } = await getAuthUser(request);

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
    action?: "complete" | "dispute";
    description?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { listingId, action, description } = body;

  if (!listingId) {
    return NextResponse.json(
      { error: "Listing ID is required." },
      { status: 400 }
    );
  }

  if (!action || !["complete", "dispute"].includes(action)) {
    return NextResponse.json(
      { error: "Action must be 'complete' or 'dispute'." },
      { status: 400 }
    );
  }

  // Get the listing
  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id, status, title")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 }
    );
  }

  if (listing.status === "sold") {
    return NextResponse.json(
      { error: "This trade has already been completed." },
      { status: 400 }
    );
  }

  // Require an accepted offer
  const { data: acceptedOffer } = await supabase
    .from("offers")
    .select("id, offerer_id")
    .eq("listing_id", listingId)
    .eq("status", "accepted")
    .limit(1)
    .maybeSingle();

  if (!acceptedOffer) {
    return NextResponse.json(
      { error: "An offer must be accepted before completing a trade." },
      { status: 400 }
    );
  }

  // Verify the user is one of the two trade parties
  const isOwner = listing.user_id === user.id;
  const isBuyer = acceptedOffer.offerer_id === user.id;

  if (!isOwner && !isBuyer) {
    return NextResponse.json(
      { error: "You must be involved in this trade." },
      { status: 403 }
    );
  }

  // Check for existing completion/dispute by this user
  const { data: existing } = await supabase
    .from("trade_completions")
    .select("id, status")
    .eq("listing_id", listingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.status === "disputed"
            ? "You have already disputed this trade."
            : "You have already completed this trade.",
      },
      { status: 409 }
    );
  }

  // For disputes: cannot dispute if you already completed
  // (covered above — existing check catches this)
  // Also cannot dispute if a dispute already exists from the other party
  if (action === "dispute") {
    const { data: otherDispute } = await supabase
      .from("trade_completions")
      .select("id")
      .eq("listing_id", listingId)
      .eq("status", "disputed")
      .limit(1)
      .maybeSingle();

    if (otherDispute) {
      return NextResponse.json(
        { error: "A dispute is already open for this trade." },
        { status: 409 }
      );
    }
  }

  const status = action === "complete" ? "completed" : "disputed";

  // Insert the completion/dispute
  const { error: insertError } = await supabase
    .from("trade_completions")
    .insert({
      listing_id: listingId,
      user_id: user.id,
      status,
    });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to record trade action." },
      { status: 500 }
    );
  }

  // If dispute: auto-create a report
  if (action === "dispute") {
    const reportedUserId = isOwner
      ? acceptedOffer.offerer_id
      : listing.user_id;

    await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      listing_id: listingId,
      reason: "trade_dispute",
      description: description?.trim() || "Trade dispute filed.",
    });
  }

  // If both parties have now completed, mark listing as sold
  let bothCompleted = false;
  if (action === "complete") {
    const { count } = await supabase
      .from("trade_completions")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", listingId)
      .in("status", ["completed", "auto_completed"]);

    if (count && count >= 2) {
      bothCompleted = true;
      // Admin client: when the second completer is the offerer, RLS would
      // silently no-op the update on the owner's listing (latent since S8 —
      // half of all trades stayed "active" until both parties rated)
      await supabaseAdmin
        .from("listings")
        .update({ status: "sold" })
        .eq("id", listingId);
    }
  }

  // Email the trade progress (after the response is sent)
  if (action === "complete") {
    after(async () => {
      const otherPartyId = isOwner
        ? acceptedOffer.offerer_id
        : listing.user_id;
      const { data: actor } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      const data = {
        fromUsername: actor?.username,
        listingTitle: listing.title,
        listingId: listing.id,
      };
      if (bothCompleted) {
        // Both sides done — invite both parties to rate each other
        await notifyUser(otherPartyId, "trade_ready_to_rate", data);
        await notifyUser(user.id, "trade_ready_to_rate", data);
      } else {
        await notifyUser(otherPartyId, "trade_partner_completed", data);
      }
    });
  }

  return NextResponse.json({ success: true, status }, { status: 201 });
}

// GET — get trade completions for a listing
export async function GET(request: NextRequest) {
  // Bearer-aware so mobile clients read with user context (cookie flows
  // behave identically; the table is publicly readable either way)
  const { supabase } = await getAuthUser(request);
  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId");

  if (!listingId) {
    return NextResponse.json(
      { error: "listingId parameter is required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("trade_completions")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load trade completions." },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}
