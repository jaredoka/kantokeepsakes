import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LISTING_DURATION_DAYS = 30;

export async function POST(
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

  // Check ban status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    return NextResponse.json(
      { error: "Your account has been banned." },
      { status: 403 }
    );
  }

  // Fetch listing
  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id, status")
    .eq("id", id)
    .single();

  if (!listing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 }
    );
  }

  if (listing.user_id !== user.id) {
    return NextResponse.json(
      { error: "You can only relist your own listings." },
      { status: 403 }
    );
  }

  if (listing.status !== "expired") {
    return NextResponse.json(
      { error: "Only expired listings can be relisted." },
      { status: 400 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  const { error } = await supabase
    .from("listings")
    .update({
      status: "active",
      bumped_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to relist." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    expires_at: expiresAt.toISOString(),
  });
}
