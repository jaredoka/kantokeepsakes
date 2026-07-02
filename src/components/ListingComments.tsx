"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ListingCommentWithProfile } from "@/lib/marketplace/types";
import { formatTimeAgo } from "@/lib/marketplace/dates";
import styles from "./ListingComments.module.css";

interface ListingCommentsProps {
  listingId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

const MAX_LENGTH = 500;

export default function ListingComments({
  listingId,
  currentUserId,
  isAdmin = false,
}: ListingCommentsProps) {
  const [comments, setComments] = useState<ListingCommentWithProfile[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchComments() {
      try {
        const res = await fetch(`/api/listings/${listingId}/comments`);
        if (cancelled) return;
        if (res.ok) {
          setComments(await res.json());
        } else if (res.status === 503) {
          setUnavailable(true);
        }
      } catch {
        // silent fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchComments();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    setError("");

    try {
      const res = await fetch(`/api/listings/${listingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [...prev, data]);
        setText("");
      } else {
        setError(data.error || "Failed to post comment.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    setError("");

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete comment.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading || unavailable) return null;

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.heading}>
        Comments <span className={styles.count}>({comments.length})</span>
      </h2>

      {comments.length === 0 ? (
        <p className={styles.empty}>
          No comments yet. Vouch for the trader, ask a question, or vet the
          trade.
        </p>
      ) : (
        <ul className={styles.list}>
          {comments.map((c) => (
            <li key={c.id} className={styles.comment}>
              <div className={styles.commentHeader}>
                <Link
                  href={`/marketplace/user/${c.profiles?.username ?? ""}`}
                  className={styles.author}
                >
                  {c.profiles?.username || "Unknown"}
                </Link>
                {c.profiles && (
                  <span className={styles.trades}>
                    {c.profiles.completed_trades} trade
                    {c.profiles.completed_trades !== 1 ? "s" : ""}
                  </span>
                )}
                <span className={styles.date}>{formatTimeAgo(c.created_at)}</span>
                {(c.user_id === currentUserId || isAdmin) && (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    aria-label="Delete comment"
                  >
                    {deletingId === c.id ? "…" : "×"}
                  </button>
                )}
              </div>
              <p className={styles.body}>{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {currentUserId && (
        <form onSubmit={handlePost} className={styles.form}>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            maxLength={MAX_LENGTH}
            rows={2}
          />
          <div className={styles.formFooter}>
            <span className={styles.charCount}>
              {text.length}/{MAX_LENGTH}
            </span>
            <button
              type="submit"
              className={styles.postBtn}
              disabled={posting || !text.trim()}
            >
              {posting ? "Posting..." : "Post comment"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
