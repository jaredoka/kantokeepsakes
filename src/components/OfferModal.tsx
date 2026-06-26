"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateOfferMessage } from "@/lib/marketplace/validation";
import CardSearch from "@/components/CardSearch";
import type { HaveImage } from "@/lib/marketplace/types";
import styles from "./OfferModal.module.css";

interface OfferModalProps {
  listingId: string;
  onClose: () => void;
}

export default function OfferModal({ listingId, onClose }: OfferModalProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [cardImages, setCardImages] = useState<HaveImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const msgValidation = validateOfferMessage(message);
    if (!msgValidation.valid) {
      setError(msgValidation.error!);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          message: message.trim(),
          frontImage: cardImages[0]?.url || null,
          backImage: null,
        }),
      });

      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send offer.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.heading}>Make an Offer</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="offerMessage" className={styles.label}>
              Message
            </label>
            <textarea
              id="offerMessage"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={styles.textarea}
              placeholder="Describe your offer..."
              rows={3}
              maxLength={1000}
            />
            <span className={styles.charCount}>{message.length}/1000</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Card Image <span className={styles.optional}>(optional)</span>
            </label>
            <CardSearch
              mode="have"
              haveImages={cardImages}
              onHaveImagesChange={setCardImages}
              max={1}
            />
          </div>

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
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
