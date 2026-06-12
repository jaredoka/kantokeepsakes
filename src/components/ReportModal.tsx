"use client";

import { useState } from "react";
import {
  REPORT_REASONS,
  type ReportReason,
} from "@/lib/marketplace/types";
import styles from "./ReportModal.module.css";

const REASON_LABELS: Record<ReportReason, string> = {
  scam: "Scam / Fraud",
  spam: "Spam",
  harassment: "Harassment",
  inappropriate: "Inappropriate Content",
  other: "Other",
};

interface ReportModalProps {
  reportedUserId: string;
  listingId?: string;
  onClose: () => void;
}

export default function ReportModal({
  reportedUserId,
  listingId,
  onClose,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId,
          listingId,
          reason,
          description: description.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit report.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Report Listing</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {success ? (
          <div className={styles.successContent}>
            <p className={styles.successText}>
              Thank you. Your report has been submitted and will be reviewed.
            </p>
            <button className={styles.doneBtn} onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Reason</legend>
              {REPORT_REASONS.map((r) => (
                <label key={r} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className={styles.radio}
                  />
                  {REASON_LABELS[r]}
                </label>
              ))}
            </fieldset>

            <label className={styles.textareaLabel}>
              Additional details (optional)
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Describe the issue..."
              />
            </label>

            {error && <p className={styles.errorText}>{error}</p>}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting || !reason}
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
