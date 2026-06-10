"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

interface ConversationItem {
  id: string;
  listing_id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  listings: {
    id: string;
    title: string;
    type: string;
    images: string[];
    status: string;
  };
  participant1: { username: string };
  participant2: { username: string };
  lastMessage: {
    body: string;
    sender_id: string;
    created_at: string;
  } | null;
  unreadCount: number;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthed(false);
        setLoading(false);
        return;
      }

      setAuthed(true);
      setUserId(user.id);

      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <main className={styles.main}>
        <p className={styles.loadingText}>Loading...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className={styles.main}>
        <div className={styles.empty}>
          <h1 className={styles.title}>Inbox</h1>
          <p className={styles.emptyText}>
            You need to be logged in to view your messages.
          </p>
          <div className={styles.authLinks}>
            <Link href="/login" className={styles.primaryBtn}>
              Log in
            </Link>
            <Link href="/signup" className={styles.secondaryBtn}>
              Sign up
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Inbox</h1>

        {conversations.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No messages yet.</p>
            <Link href="/marketplace" className={styles.primaryBtn}>
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className={styles.list}>
            {conversations.map((conv) => {
              const otherUser =
                conv.participant_1 === userId
                  ? conv.participant2.username
                  : conv.participant1.username;

              const preview = conv.lastMessage
                ? conv.lastMessage.body.length > 80
                  ? conv.lastMessage.body.slice(0, 80) + "..."
                  : conv.lastMessage.body
                : "No messages yet";

              const timeAgo = conv.lastMessage
                ? formatTimeAgo(conv.lastMessage.created_at)
                : "";

              return (
                <Link
                  key={conv.id}
                  href={`/marketplace/inbox/${conv.id}`}
                  className={`${styles.convItem} ${conv.unreadCount > 0 ? styles.convUnread : ""}`}
                >
                  <div className={styles.convLeft}>
                    {conv.listings.images.length > 0 ? (
                      <img
                        src={conv.listings.images[0]}
                        alt={conv.listings.title}
                        className={styles.convImage}
                      />
                    ) : (
                      <div className={styles.convImagePlaceholder}>
                        {conv.listings.type}
                      </div>
                    )}
                  </div>
                  <div className={styles.convBody}>
                    <div className={styles.convHeader}>
                      <span className={styles.convUser}>{otherUser}</span>
                      {timeAgo && (
                        <span className={styles.convTime}>{timeAgo}</span>
                      )}
                    </div>
                    <span className={styles.convListing}>
                      {conv.listings.title}
                    </span>
                    <span className={styles.convPreview}>{preview}</span>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>
                      {conv.unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
