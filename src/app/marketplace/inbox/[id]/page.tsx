"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ChatInput from "@/components/ChatInput";
import type { Message } from "@/lib/marketplace/types";
import styles from "./page.module.css";

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) return time;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) return `Yesterday ${time}`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ` ${time}`;
}

interface ConversationMeta {
  id: string;
  listing_id: string;
  participant_1: string;
  participant_2: string;
  listings: { id: string; title: string; type: string };
  participant1: { username: string };
  participant2: { username: string };
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: conversationId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load conversation meta and messages
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to view messages.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Fetch conversation metadata
      const { data: conv } = await supabase
        .from("conversations")
        .select(
          `
          *,
          listings(id, title, type),
          participant1:profiles!conversations_participant_1_fkey(username),
          participant2:profiles!conversations_participant_2_fkey(username)
        `
        )
        .eq("id", conversationId)
        .single();

      if (!conv) {
        setError("Conversation not found.");
        setLoading(false);
        return;
      }

      if (conv.participant_1 !== user.id && conv.participant_2 !== user.id) {
        setError("You don't have access to this conversation.");
        setLoading(false);
        return;
      }

      setMeta(conv as ConversationMeta);

      // Fetch messages
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?limit=50`
      );
      if (res.ok) {
        const msgs: Message[] = await res.json();
        setMessages(msgs.reverse()); // API returns newest-first, we want oldest-first
      }

      setLoading(false);
    }

    load();
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read if from the other user
          if (newMsg.sender_id !== userId) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  async function handleSend(body: string) {
    setSending(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send message.");
        setSending(false);
        return;
      }

      const newMsg: Message = await res.json();
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <p className={styles.loadingText}>Loading...</p>
      </main>
    );
  }

  if (error && !meta) {
    return (
      <main className={styles.main}>
        <div className={styles.errorState}>
          <p>{error}</p>
          <Link href="/marketplace/inbox" className={styles.backBtn}>
            Back to Inbox
          </Link>
        </div>
      </main>
    );
  }

  const otherUsername =
    meta!.participant_1 === userId
      ? meta!.participant2.username
      : meta!.participant1.username;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Chat header */}
        <div className={styles.chatHeader}>
          <Link href="/marketplace/inbox" className={styles.backLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div className={styles.chatHeaderInfo}>
            <span className={styles.chatHeaderUser}>{otherUsername}</span>
            <Link
              href={`/marketplace/${meta!.listing_id}`}
              className={styles.chatHeaderListing}
            >
              {meta!.listings.type}: {meta!.listings.title}
            </Link>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messagesContainer} ref={containerRef}>
          {messages.length === 0 ? (
            <p className={styles.noMessages}>
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === userId;
              return (
                <div
                  key={msg.id}
                  className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}
                >
                  <p className={styles.bubbleText}>{msg.body}</p>
                  <span className={styles.bubbleTime}>
                    {formatMessageTime(msg.created_at)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && <p className={styles.sendError}>{error}</p>}

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={sending} />
      </div>
    </main>
  );
}
