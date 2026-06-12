import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let body: { userId?: string; ban?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { userId, ban } = body;

  if (!userId || typeof ban !== "boolean") {
    return NextResponse.json(
      { error: "userId (string) and ban (boolean) are required." },
      { status: 400 }
    );
  }

  if (userId === adminId) {
    return NextResponse.json(
      { error: "You cannot ban yourself." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: ban })
    .eq("id", userId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update ban status." },
      { status: 500 }
    );
  }

  // If banning, also mark all active listings as removed
  if (ban) {
    await supabase
      .from("listings")
      .update({ status: "removed" })
      .eq("user_id", userId)
      .eq("status", "active");
  }

  return NextResponse.json({ success: true, banned: ban });
}
