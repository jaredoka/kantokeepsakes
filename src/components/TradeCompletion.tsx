"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./TradeCompletion.module.css";

interface Completion {
  id: string;
  user_id: string;
  status: "completed" | "disputed" | "auto_completed";
  created_at: string;
}

interface TradeCompletionProps {
  listingId: string;
  isOwner: boolean;
  isAuthenticated: boolean;
  isSold: boolean;
  hasAcceptedOffer: boolean;
  currentUserId?: string;
}

export default function TradeCompletion({
  listingId,
  isOwner,
  isAuthenticated,
  isSold,
  hasAcceptedOffer,
  currentUserId,
}: TradeCompletionProps) {
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const fetchCompletions = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/trade-completions?listingId=${listingId}`
      );
      if (res.ok) {
        const data: Completion[] = await res.json();
        setCompletions(data);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    if (hasAcceptedOffer) {
      fetchCompletions();
    } else {
      setLoading(false);
    }
  }, [hasAcceptedOffer, fetchCompletions]);

  async function handleAction(action: "complete" | "dispute") {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/trade-completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          action,
          description:
            action === "dispute" ? disputeDescription.trim() || undefined : undefined,
        }),
      });

      if (res.ok) {
        setShowDisputeForm(false);
        setDisputeDescription("");
        fetchCompletions();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;
  if (!hasAcceptedOffer) return null;

  const myCompletion = completions.find((c) => c.user_id === currentUserId);
  const otherCompletion = completions.find((c) => c.user_id !== currentUserId);

  const bothCompleted =
    completions.filter(
      (c) => c.status === "completed" || c.status === "auto_completed"
    ).length >= 2;

  const hasDispute = completions.some((c) => c.status === "disputed");

  // If listing is already sold and both completed, show success
  if (isSold && bothCompleted) {
    return (
      <div className={styles.section}>
        <h3 className={styles.heading}>Trade Status</h3>
        <div className={styles.completeBanner}>
          Both parties confirmed this trade. You can now rate each other below.
        </div>
      </div>
    );
  }

  // If there's an active dispute
  if (hasDispute) {
    return (
      <div className={styles.section}>
        <h3 className={styles.heading}>Trade Status</h3>
        <div className={styles.disputeBanner}>
          A trade dispute has been filed and is under admin review.
        </div>
      </div>
    );
  }

  // Not authenticated — show nothing interactive
  if (!isAuthenticated || !currentUserId) {
    return null;
  }

  // User is not a trade party — nothing to show
  if (!isOwner && !myCompletion && !otherCompletion) {
    // Could be an uninvolved viewer; the API enforces access control
    return null;
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.heading}>Trade Status</h3>

      {error && <p className={styles.errorText}>{error}</p>}

      {/* Neither party has completed yet */}
      {!myCompletion && !otherCompletion && (
        <div className={styles.statusBlock}>
          <p className={styles.statusText}>
            An offer has been accepted. Once the trade is done, confirm below.
          </p>
          <div className={styles.actions}>
            <button
              className={styles.completeBtn}
              onClick={() => handleAction("complete")}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Complete Trade"}
            </button>
            <button
              className={styles.disputeBtn}
              onClick={() => setShowDisputeForm(!showDisputeForm)}
              disabled={submitting}
            >
              Dispute
            </button>
          </div>
        </div>
      )}

      {/* Current user completed, waiting for other */}
      {myCompletion &&
        (myCompletion.status === "completed" ||
          myCompletion.status === "auto_completed") &&
        !otherCompletion && (
          <div className={styles.statusBlock}>
            <div className={styles.pendingBanner}>
              You have completed this trade. Waiting for the other party to
              confirm (auto-completes in ~3 days).
            </div>
          </div>
        )}

      {/* Other party completed, current user hasn't */}
      {!myCompletion && otherCompletion &&
        (otherCompletion.status === "completed" ||
          otherCompletion.status === "auto_completed") && (
          <div className={styles.statusBlock}>
            <div className={styles.urgentBanner}>
              The other party has completed this trade. Please confirm or
              dispute.
            </div>
            <div className={styles.actions}>
              <button
                className={styles.completeBtn}
                onClick={() => handleAction("complete")}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Complete Trade"}
              </button>
              <button
                className={styles.disputeBtn}
                onClick={() => setShowDisputeForm(!showDisputeForm)}
                disabled={submitting}
              >
                Dispute
              </button>
            </div>
          </div>
        )}

      {/* Dispute form */}
      {showDisputeForm && (
        <div className={styles.disputeForm}>
          <p className={styles.disputeLabel}>
            Describe the issue with this trade:
          </p>
          <textarea
            className={styles.disputeInput}
            placeholder="Explain why you are disputing this trade (optional)"
            value={disputeDescription}
            onChange={(e) => setDisputeDescription(e.target.value)}
            maxLength={1000}
            rows={3}
          />
          <div className={styles.disputeActions}>
            <button
              className={styles.disputeSubmitBtn}
              onClick={() => handleAction("dispute")}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Dispute"}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => {
                setShowDisputeForm(false);
                setDisputeDescription("");
              }}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
