import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH — accept or decline an offer (listing owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  let body: { status?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { status } = body;

  if (status !== "accepted" && status !== "declined") {
    return NextResponse.json(
      { error: "Status must be 'accepted' or 'declined'." },
      { status: 400 }
    );
  }

  // Get the offer with listing info
  const { data: offer } = await supabase
    .from("offers")
    .select("id, listing_id, offerer_id, status, listings(user_id)")
    .eq("id", id)
    .single();

  if (!offer) {
    return NextResponse.json(
      { error: "Offer not found." },
      { status: 404 }
    );
  }

  // Only the listing owner can accept/decline
  const listing = offer.listings as unknown as { user_id: string };
  if (listing.user_id !== user.id) {
    return NextResponse.json(
      { error: "Only the listing owner can respond to offers." },
      { status: 403 }
    );
  }

  if (offer.status !== "pending") {
    return NextResponse.json(
      { error: "This offer has already been responded to." },
      { status: 400 }
    );
  }

  // Update the offer status
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

  // If accepting, decline all other pending offers on this listing
  if (status === "accepted") {
    await supabase
      .from("offers")
      .update({ status: "declined" })
      .eq("listing_id", offer.listing_id)
      .neq("id", id)
      .eq("status", "pending");
  }

  return NextResponse.json({ success: true });
}
