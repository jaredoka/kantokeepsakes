"use client";

import { useCallback, useEffect, useState } from "react";
import StarRating from "./StarRating";
import styles from "./TradeConfirmation.module.css";

interface Confirmation {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  confirmer: { username: string } | null;
}

interface TradeConfirmationProps {
  listingId: string;
  isOwner: boolean;
  isAuthenticated: boolean;
  isSold: boolean;
  hasAcceptedOffer?: boolean;
}

export default function TradeConfirmation({
  listingId,
  isOwner,
  isAuthenticated,
  isSold,
  hasAcceptedOffer = false,
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

  // Check if current user already confirmed
  useEffect(() => {
    fetchConfirmations();
  }, [fetchConfirmations]);

  useEffect(() => {
    // The API returns 409 if the user already confirmed, but we can also
    // check client-side by seeing if any confirmation's confirmer matches
    // (we don't have the current username here, so we rely on submit-time check)
  }, [confirmations]);

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
          setError(data.error || "Failed to submit confirmation.");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  const showForm = isAuthenticated && !hasConfirmed && !success && hasAcceptedOffer;
  const bothConfirmed = confirmations.length >= 2;

  return (
    <div className={styles.section}>
      <h3 className={styles.heading}>Trade Confirmation</h3>

      {/* Status */}
      {bothConfirmed && (
        <div className={styles.completeBanner}>
          Both parties confirmed this trade.
        </div>
      )}

      {isSold && !bothConfirmed && confirmations.length === 1 && (
        <div className={styles.pendingBanner}>
          One party has confirmed. Waiting for the other.
        </div>
      )}

      {/* Confirmation form — only for involved parties */}
      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <p className={styles.formLabel}>
            {isOwner
              ? "Confirm this trade and rate the buyer:"
              : "Confirm this trade and rate the seller:"}
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
            {submitting ? "Submitting..." : "Confirm Trade"}
          </button>
        </form>
      )}

      {success && (
        <div className={styles.successBanner}>
          Trade confirmed! Thank you for your feedback.
        </div>
      )}

      {hasConfirmed && !success && (
        <p className={styles.alreadyConfirmed}>
          You have already confirmed this trade.
        </p>
      )}

      {!isAuthenticated && confirmations.length === 0 && (
        <p className={styles.noConfirmations}>No trade confirmations yet.</p>
      )}

      {/* Existing confirmations / reviews */}
      {confirmations.length > 0 && (
        <div className={styles.reviews}>
          <h4 className={styles.reviewsHeading}>
            Reviews ({confirmations.length})
          </h4>
          {confirmations.map((c) => (
            <div key={c.id} className={styles.review}>
              <div className={styles.reviewHeader}>
                <span className={styles.reviewUser}>
                  {c.confirmer?.username || "Unknown"}
                </span>
                <StarRating value={c.rating} readonly size="sm" />
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
