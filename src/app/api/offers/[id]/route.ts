import { NextRequest, NextResponse, after } from "next/server";
import { getAuthUser } from "@/lib/supabase/api-auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { validateOfferMessage } from "@/lib/marketplace/validation";
import { notifyUser } from "@/lib/email";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH — respond to a pending offer turn: accept, decline, or counter.
// Either trade party may respond, but only to a turn the *other* party
// authored (a turn's author is offerer_id unless author_id says otherwise).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  let body: { status?: string; message?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { status, message } = body;

  if (status !== "accepted" && status !== "declined" && status !== "countered") {
    return NextResponse.json(
      { error: "Status must be 'accepted', 'declined' or 'countered'." },
      { status: 400 }
    );
  }

  // Get the offer with listing info (select * so the route works whether or
  // not migration 00019 has added the threading columns)
  const { data: offer } = await supabase
    .from("offers")
    .select("*, listings(user_id, title)")
    .eq("id", id)
    .single();

  if (!offer) {
    return NextResponse.json(
      { error: "Offer not found." },
      { status: 404 }
    );
  }

  const listing = offer.listings as unknown as { user_id: string; title: string };
  const isOwner = listing.user_id === user.id;
  const isOfferer = offer.offerer_id === user.id;

  if (!isOwner && !isOfferer) {
    return NextResponse.json(
      { error: "You are not part of this negotiation." },
      { status: 403 }
    );
  }

  if (offer.status !== "pending") {
    return NextResponse.json(
      { error: "This offer has already been responded to." },
      { status: 400 }
    );
  }

  // Whose turn is it? Only the party who did NOT author this turn may respond.
  const authoredByOwner = !!offer.author_id && offer.author_id !== offer.offerer_id;
  const responderId = authoredByOwner ? offer.offerer_id : listing.user_id;
  if (user.id !== responderId) {
    return NextResponse.json(
      { error: "Waiting for the other party to respond to this offer." },
      { status: 403 }
    );
  }

  // ── Counter: append a new turn, then mark this turn countered ────────────
  if (status === "countered") {
    if (!message) {
      return NextResponse.json(
        { error: "A counteroffer message is required." },
        { status: 400 }
      );
    }
    const msgValidation = validateOfferMessage(message);
    if (!msgValidation.valid) {
      return NextResponse.json({ error: msgValidation.error }, { status: 400 });
    }

    const { data: counter, error: counterError } = await supabase
      .from("offers")
      .insert({
        listing_id: offer.listing_id,
        offerer_id: offer.offerer_id, // stays the non-owner party
        author_id: user.id,
        parent_offer_id: offer.id,
        message: message.trim(),
      })
      .select("id")
      .single();

    if (counterError) {
      return NextResponse.json(
        { error: "Failed to create counteroffer." },
        { status: 500 }
      );
    }

    const { error: markError } = await supabase
      .from("offers")
      .update({ status: "countered" })
      .eq("id", id);

    if (markError) {
      // Roll back the new turn so we don't leave two pending turns
      await supabaseAdmin.from("offers").delete().eq("id", counter.id);
      return NextResponse.json(
        { error: "Failed to update the offer." },
        { status: 500 }
      );
    }

    // Email the other party (after the response is sent)
    const counterRecipient = authoredByOwner ? listing.user_id : offer.offerer_id;
    after(async () => {
      const { data: responder } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      await notifyUser(counterRecipient, "offer_countered", {
        fromUsername: responder?.username,
        listingTitle: listing.title,
        listingId: offer.listing_id,
      });
    });

    return NextResponse.json({ success: true, counterId: counter.id });
  }

  // ── Accept / decline ──────────────────────────────────────────────────────
  const { error: updateError } = await supabase
    .from("offers")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update offer." },
      { status: 500 }
    );
  }

  // If accepting, decline all other pending offers on this listing.
  // Uses the admin client: when the offerer accepts an owner's counter,
  // RLS would block them from touching other buyers' offers.
  if (status === "accepted") {
    await supabaseAdmin
      .from("offers")
      .update({ status: "declined" })
      .eq("listing_id", offer.listing_id)
      .neq("id", id)
      .eq("status", "pending");
  }

  // Email the author of the turn that was just responded to
  const recipientId = authoredByOwner ? listing.user_id : offer.offerer_id;
  after(async () => {
    const { data: responder } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    await notifyUser(
      recipientId,
      status === "accepted" ? "offer_accepted" : "offer_declined",
      {
        fromUsername: responder?.username,
        listingTitle: listing.title,
        listingId: offer.listing_id,
      }
    );
  });

  return NextResponse.json({ success: true });
}
