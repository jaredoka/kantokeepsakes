import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateOfferMessage } from "@/lib/marketplace/validation";

// POST — create a new offer on a listing
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
    message?: string;
    frontImage?: string | null;
    backImage?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { listingId, message, frontImage, backImage } = body;

  if (!listingId) {
    return NextResponse.json(
      { error: "Listing ID is required." },
      { status: 400 }
    );
  }

  if (!message) {
    return NextResponse.json(
      { error: "Offer message is required." },
      { status: 400 }
    );
  }

  const msgValidation = validateOfferMessage(message);
  if (!msgValidation.valid) {
    return NextResponse.json(
      { error: msgValidation.error },
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

  if (listing.status !== "active") {
    return NextResponse.json(
      { error: "This listing is no longer active." },
      { status: 400 }
    );
  }

  // Cannot offer on your own listing
  if (listing.user_id === user.id) {
    return NextResponse.json(
      { error: "You cannot make an offer on your own listing." },
      { status: 400 }
    );
  }

  // Check for existing pending offer from this user
  const { data: existingOffer } = await supabase
    .from("offers")
    .select("id")
    .eq("listing_id", listingId)
    .eq("offerer_id", user.id)
    .eq("status", "pending")
    .single();

  if (existingOffer) {
    return NextResponse.json(
      { error: "You already have a pending offer on this listing." },
      { status: 409 }
    );
  }

  // Insert the offer
  const { data: newOffer, error: insertError } = await supabase
    .from("offers")
    .insert({
      listing_id: listingId,
      offerer_id: user.id,
      message: message.trim(),
      front_image: frontImage || null,
      back_image: backImage || null,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to create offer." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: newOffer.id }, { status: 201 });
}

// GET — list offers for a listing or by the current user
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId");

  if (listingId) {
    // Return offers for this listing — only if user is the listing owner or an offerer
    const { data: listing } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", listingId)
      .single();

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    const isOwner = listing.user_id === user.id;

    let query = supabase
      .from("offers")
      .select(
        "*, profiles:profiles!offers_offerer_id_fkey(username, avatar_url, reputation_score, completed_trades)"
      )
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    // Non-owners can only see their own offers
    if (!isOwner) {
      query = query.eq("offerer_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to load offers." },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  }

  // No listingId — return all offers made by this user
  const { data, error } = await supabase
    .from("offers")
    .select(
      "*, listings(id, title, type, images)"
    )
    .eq("offerer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load offers." },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}
