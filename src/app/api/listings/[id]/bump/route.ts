import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/api-auth";

const BUMP_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const LISTING_DURATION_DAYS = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase } = await getAuthUser(request);

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
    .select("id, user_id, status, bumped_at")
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
      { error: "You can only bump your own listings." },
      { status: 403 }
    );
  }

  if (listing.status !== "active") {
    return NextResponse.json(
      { error: "Only active listings can be bumped." },
      { status: 400 }
    );
  }

  // Check 24h cooldown
  const lastBump = new Date(listing.bumped_at).getTime();
  const now = Date.now();

  if (now - lastBump < BUMP_COOLDOWN_MS) {
    const nextBumpAt = new Date(lastBump + BUMP_COOLDOWN_MS);
    return NextResponse.json(
      {
        error: "You can only bump once every 24 hours.",
        nextBumpAt: nextBumpAt.toISOString(),
      },
      { status: 429 }
    );
  }

  // Bump: update bumped_at and extend expires_at
  const newExpiresAt = new Date(
    now + LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  const { error } = await supabase
    .from("listings")
    .update({
      bumped_at: new Date(now).toISOString(),
      expires_at: newExpiresAt.toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to bump listing." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    bumped_at: new Date(now).toISOString(),
    expires_at: newExpiresAt.toISOString(),
  });
}
