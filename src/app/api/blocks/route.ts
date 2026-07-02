import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/api-auth";

// GET — the current user's block list (B6)
export async function GET(request: NextRequest) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_id, created_at, profiles!blocks_blocked_id_fkey(username)")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load blocks." }, { status: 500 });
  }
  return NextResponse.json(data || []);
}

// POST — block a user
export async function POST(request: NextRequest) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const blockedId = body.userId;
  if (!blockedId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }
  if (blockedId === user.id) {
    return NextResponse.json({ error: "You cannot block yourself." }, { status: 400 });
  }

  const { error } = await supabase.from("blocks").upsert(
    { blocker_id: user.id, blocked_id: blockedId },
    { onConflict: "blocker_id,blocked_id" }
  );

  if (error) {
    return NextResponse.json({ error: "Failed to block user." }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}

// DELETE — unblock a user
export async function DELETE(request: NextRequest) {
  const { user, supabase } = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", body.userId);

  return NextResponse.json({ success: true });
}
