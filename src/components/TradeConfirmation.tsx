"use client";

import { useCallback, useEffect, useState } from "react";
import StarRating from "./StarRating";
import styles from "./TradeConfirmation.module.css";

interface Confirmation {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  confirmer_id: string;
  confirmer: { username: string } | null;
  revealed: boolean;
}

interface TradeConfirmationProps {
  listingId: string;
  isOwner: boolean;
  isAuthenticated: boolean;
  isSold: boolean;
  hasAcceptedOffer?: boolean;
  bothCompleted?: boolean;
}

export default function TradeConfirmation({
  listingId,
  isOwner,
  isAuthenticated,
  isSold,
  hasAcceptedOffer = false,
  bothCompleted = false,
}: TradeConfirmationProps) {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchConfirmations = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/trade-confirmations?listingId=${listingId}`
      );
      if (res.ok) {
        const data: Confirmation[] = await res.json();
        setConfirmations(data);
      }
    } catch {
      // Silently fail — confirmations are supplementary
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchConfirmations();
  }, [fetchConfirmations]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/trade-confirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setHasConfirmed(true);
        fetchConfirmations();
      } else {
        const data = await res.json();
        if (res.status === 409) {
          setHasConfirmed(true);
          setError("");
        } else {
          setError(data.error || "Failed to submit rating.");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  // Only show the rating section after both parties have completed the trade
  const showForm =
    isAuthenticated &&
    !hasConfirmed &&
    !success &&
    hasAcceptedOffer &&
    bothCompleted;

  return (
    <div className={styles.section}>
      <h3 className={styles.heading}>
        {bothCompleted ? "Rate This Trade" : "Trade Ratings"}
      </h3>

      {/* Rating form — only after both parties completed */}
      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <p className={styles.formLabel}>
            {isOwner ? "Rate the buyer:" : "Rate the seller:"}
          </p>

          <div className={styles.ratingRow}>
            <span className={styles.ratingLabel}>Rating:</span>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <textarea
            className={styles.commentInput}
            placeholder="Optional comment (max 500 characters)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
          />

          {error && <p className={styles.errorText}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting || rating === 0}
          >
            {submitting ? "Submitting..." : "Submit Rating"}
          </button>
        </form>
      )}

      {success && (
        <div className={styles.successBanner}>
          Rating submitted! It will be visible once both parties have rated (or
          after 14 days).
        </div>
      )}

      {hasConfirmed && !success && (
        <p className={styles.alreadyConfirmed}>
          You have already rated this trade.
        </p>
      )}

      {!bothCompleted && confirmations.length === 0 && (
        <p className={styles.noConfirmations}>
          Ratings will be available after both parties complete the trade.
        </p>
      )}

      {/* Existing reviews — respect double-blind */}
      {confirmations.length > 0 && (
        <div className={styles.reviews}>
          <h4 className={styles.reviewsHeading}>
            Reviews ({confirmations.length})
          </h4>
          {confirmations.map((c) => (
            <div key={c.id} className={styles.review}>
              {c.revealed ? (
                <>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewUser}>
                      {c.confirmer?.username || "Unknown"}
                    </span>
                    <StarRating value={c.rating || 0} readonly size="sm" />
                    <span className={styles.reviewDate}>
                      {new Date(c.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {c.comment && (
                    <p className={styles.reviewComment}>{c.comment}</p>
                  )}
                </>
              ) : (
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewUser}>Rating hidden</span>
                  <span className={styles.reviewDate}>
                    Visible once both parties rate or after 14 days
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
