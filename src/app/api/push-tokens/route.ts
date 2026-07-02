import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/supabase/api-auth";

// Writes use the admin client (after auth): a device that switches accounts
// must be able to re-own its token, which per-user RLS would block.
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST — register (upsert) an Expo push token for the current user (B4)
export async function POST(request: NextRequest) {
  const { user } = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { token?: string; platform?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = body.token?.trim();
  const platform = body.platform;
  if (!token || (platform !== "ios" && platform !== "android")) {
    return NextResponse.json(
      { error: "token and platform ('ios' | 'android') are required." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("push_tokens").upsert(
    {
      user_id: user.id,
      token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" }
  );

  if (error) {
    return NextResponse.json(
      { error: "Failed to register push token." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

// DELETE — unregister a token (on logout)
export async function DELETE(request: NextRequest) {
  const { user } = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  await supabaseAdmin
    .from("push_tokens")
    .delete()
    .eq("token", body.token)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
