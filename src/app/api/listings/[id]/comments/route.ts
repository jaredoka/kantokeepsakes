import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const COMMENT_LIMIT = 10; // max comments per minute per user
const COMMENT_WINDOW_MS = 60 * 1000;
const MAX_COMMENT_LENGTH = 500;

// GET — comments for a listing, oldest first
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listing_comments")
    .select("*, profiles(username, reputation_score, completed_trades)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    // Table missing until migration 00020 is applied
    return NextResponse.json(
      { error: "Comments are unavailable." },
      { status: 503 }
    );
  }

  return NextResponse.json(data || []);
}

// POST — add a comment to a listing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const ip = getClientIp(request.headers);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { success: withinLimit } = rateLimit(
    `comment:${user.id}:${ip}`,
    COMMENT_LIMIT,
    COMMENT_WINDOW_MS
  );

  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many comments. Please slow down." },
      { status: 429 }
    );
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

  let body: { body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const commentBody = body.body?.trim();
  if (!commentBody) {
    return NextResponse.json(
      { error: "Comment cannot be empty." },
      { status: 400 }
    );
  }

  if (commentBody.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  // Listing must exist and not be removed
  const { data: listing } = await supabase
    .from("listings")
    .select("id, status")
    .eq("id", listingId)
    .single();

  if (!listing || listing.status === "removed") {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 }
    );
  }

  const { data: comment, error: insertError } = await supabase
    .from("listing_comments")
    .insert({
      listing_id: listingId,
      user_id: user.id,
      body: commentBody,
    })
    .select("*, profiles(username, reputation_score, completed_trades)")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to post comment." },
      { status: 500 }
    );
  }

  return NextResponse.json(comment, { status: 201 });
}
