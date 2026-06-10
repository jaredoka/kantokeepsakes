import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateListing } from "@/lib/marketplace/validation";
import {
  type ListingType,
  type ListingCategory,
  type ListingLanguage,
  type Currency,
} from "@/lib/marketplace/types";

// GET — fetch a single listing (public)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*, profiles(username, reputation_score, completed_trades)")
    .eq("id", id)
    .single();

  if (error || !listing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(listing);
}

// PATCH — update own listing
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

  // Verify ownership
  const { data: existing } = await supabase
    .from("listings")
    .select("id, user_id, status")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 }
    );
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json(
      { error: "You can only edit your own listings." },
      { status: 403 }
    );
  }

  if (existing.status === "removed") {
    return NextResponse.json(
      { error: "This listing has been removed." },
      { status: 400 }
    );
  }

  let body: {
    type?: string;
    title?: string;
    description?: string;
    category?: string;
    language?: string;
    price?: number | null;
    currency?: string;
    images?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { type, title, description, category, language, price, currency, images } = body;

  const validation = validateListing({
    type: type || "",
    title: title || "",
    description: description || "",
    category: category || "",
    language: language || "",
    price: price === null || price === undefined ? "" : String(price),
    currency: currency || "",
    images: images || [],
  });

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("listings")
    .update({
      type: type as ListingType,
      title: (title as string).trim(),
      description: (description as string).trim(),
      category: category as ListingCategory,
      language: language as ListingLanguage,
      price: price ?? null,
      currency: (currency as Currency) || "BND",
      images: images || [],
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update listing." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// DELETE — delete own listing (sets status to "removed")
export async function DELETE(
  _request: NextRequest,
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

  const { data: existing } = await supabase
    .from("listings")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 }
    );
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json(
      { error: "You can only delete your own listings." },
      { status: 403 }
    );
  }

  const { error: deleteError } = await supabase
    .from("listings")
    .update({ status: "removed" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete listing." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
