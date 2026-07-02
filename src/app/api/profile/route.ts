import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/api-auth";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: NextRequest) {
  const { user } = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    username?: string;
    bio?: string;
    notifyOffers?: boolean;
    notifyMessages?: boolean;
    notifyTrades?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { username, bio, notifyOffers, notifyMessages, notifyTrades } = body;

  // Validate username if provided
  if (username !== undefined) {
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      return NextResponse.json(
        { error: "Username must be between 3 and 20 characters." },
        { status: 400 }
      );
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, hyphens, and underscores." },
        { status: 400 }
      );
    }

    // Check uniqueness (excluding self)
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", trimmed)
      .neq("id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Username is already taken." },
        { status: 409 }
      );
    }
  }

  // Validate bio if provided
  if (bio !== undefined && bio.length > 500) {
    return NextResponse.json(
      { error: "Bio must be 500 characters or fewer." },
      { status: 400 }
    );
  }

  const updates: Record<string, string | boolean | null> = {};
  if (username !== undefined) updates.username = username.trim();
  if (bio !== undefined) updates.bio = bio.trim() || null;
  if (typeof notifyOffers === "boolean") updates.notify_offers = notifyOffers;
  if (typeof notifyMessages === "boolean") updates.notify_messages = notifyMessages;
  if (typeof notifyTrades === "boolean") updates.notify_trades = notifyTrades;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("username, bio, notify_offers, notify_messages, notify_trades")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
