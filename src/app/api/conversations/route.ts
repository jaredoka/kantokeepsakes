import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — list user's conversations with last message preview
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(
      `
      *,
      listings(id, title, type, images, status),
      participant1:profiles!conversations_participant_1_fkey(username),
      participant2:profiles!conversations_participant_2_fkey(username)
    `
    )
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load conversations." },
      { status: 500 }
    );
  }

  // For each conversation, get the last message and unread count
  const enriched = await Promise.all(
    (conversations || []).map(async (conv) => {
      const { data: lastMessage } = await supabase
        .from("messages")
        .select("body, sender_id, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      return {
        ...conv,
        lastMessage: lastMessage || null,
        unreadCount: unreadCount || 0,
      };
    })
  );

  return NextResponse.json(enriched);
}

// POST — create or find existing conversation for a listing
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { listingId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { listingId } = body;
  if (!listingId) {
    return NextResponse.json(
      { error: "Listing ID is required." },
      { status: 400 }
    );
  }

  // Get the listing to find the owner
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

  if (listing.user_id === user.id) {
    return NextResponse.json(
      { error: "You cannot message yourself." },
      { status: 400 }
    );
  }

  if (listing.status !== "active") {
    return NextResponse.json(
      { error: "This listing is no longer active." },
      { status: 400 }
    );
  }

  // Check if conversation already exists between these two users for this listing
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("participant_1", listing.user_id)
    .eq("participant_2", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ id: existing.id });
  }

  // Create new conversation
  const { data: conversation, error: createError } = await supabase
    .from("conversations")
    .insert({
      listing_id: listingId,
      participant_1: listing.user_id,
      participant_2: user.id,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (createError) {
    return NextResponse.json(
      { error: "Failed to create conversation." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: conversation.id }, { status: 201 });
}
