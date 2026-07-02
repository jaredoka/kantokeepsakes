import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/email";

const MESSAGE_LIMIT = 30; // max messages per minute per user
const MESSAGE_WINDOW_MS = 60 * 1000;

// GET — paginated messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Verify user is a participant
  const { data: conversation } = await supabase
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 }
    );
  }

  if (
    conversation.participant_1 !== user.id &&
    conversation.participant_2 !== user.id
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Pagination via cursor (before param)
  const url = new URL(request.url);
  const before = url.searchParams.get("before");
  const limit = Math.min(
    Number(url.searchParams.get("limit")) || 50,
    100
  );

  let query = supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to load messages." },
      { status: 500 }
    );
  }

  // Mark messages from the other user as read
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  return NextResponse.json(messages || []);
}

// POST — send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const ip = getClientIp(request.headers);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { success: withinLimit } = rateLimit(
    `msg:${user.id}:${ip}`,
    MESSAGE_LIMIT,
    MESSAGE_WINDOW_MS
  );

  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many messages. Please slow down." },
      { status: 429 }
    );
  }

  // Verify user is a participant
  const { data: conversation } = await supabase
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 }
    );
  }

  if (
    conversation.participant_1 !== user.id &&
    conversation.participant_2 !== user.id
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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

  const messageBody = body.body?.trim();
  if (!messageBody) {
    return NextResponse.json(
      { error: "Message cannot be empty." },
      { status: 400 }
    );
  }

  if (messageBody.length > 2000) {
    return NextResponse.json(
      { error: "Message must be 2000 characters or fewer." },
      { status: 400 }
    );
  }

  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: messageBody,
      is_read: false,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }

  // Update conversation last_message_at
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  // Email the other participant — only for the first unread message, so an
  // active chat doesn't generate an email per message. Reading the chat
  // marks messages read and re-arms the notification.
  after(async () => {
    const recipientId =
      conversation.participant_1 === user.id
        ? conversation.participant_2
        : conversation.participant_1;

    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("sender_id", user.id)
      .eq("is_read", false)
      .neq("id", message.id);
    if (count && count > 0) return; // already has unread from us — no email

    const { data: sender } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    await notifyUser(recipientId, "new_message", {
      fromUsername: sender?.username,
      conversationId,
    });
  });

  return NextResponse.json(message, { status: 201 });
}
