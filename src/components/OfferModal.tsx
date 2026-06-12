"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { validateOfferMessage } from "@/lib/marketplace/validation";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/marketplace/types";
import { validateImageFile } from "@/lib/marketplace/validation";
import styles from "./OfferModal.module.css";

interface OfferModalProps {
  listingId: string;
  onClose: () => void;
}

export default function OfferModal({ listingId, onClose }: OfferModalProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [error, setError] = useState("");

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File): Promise<string | null> {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/listings/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Upload failed.");
      return null;
    }

    const data = await res.json();
    return data.url;
  }

  async function handleImageSelect(
    file: File,
    side: "front" | "back"
  ) {
    setError("");
    const setter = side === "front" ? setUploadingFront : setUploadingBack;
    setter(true);

    const url = await uploadImage(file);
    if (url) {
      if (side === "front") setFrontImage(url);
      else setBackImage(url);
    }

    setter(false);
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back"
  ) {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file, side);
    e.target.value = "";
  }

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
          frontImage,
          backImage,
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

  const acceptStr = ACCEPTED_IMAGE_TYPES.join(",");
  const isUploading = uploadingFront || uploadingBack;

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
              Card Photos <span className={styles.optional}>(optional)</span>
            </label>
            <div className={styles.imageFields}>
              <div className={styles.imageField}>
                <span className={styles.imageLabel}>Front</span>
                {frontImage ? (
                  <div className={styles.imagePreview}>
                    <img src={frontImage} alt="Front of card" />
                    <button
                      type="button"
                      className={styles.imageRemoveBtn}
                      onClick={() => setFrontImage(null)}
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.uploadBtn}
                    onClick={() => frontInputRef.current?.click()}
                    disabled={uploadingFront}
                  >
                    <span className={styles.uploadIcon}>+</span>
                    <span>{uploadingFront ? "Uploading..." : "Add front"}</span>
                  </button>
                )}
                <input
                  ref={frontInputRef}
                  type="file"
                  accept={acceptStr}
                  onChange={(e) => handleFileChange(e, "front")}
                  className={styles.hiddenInput}
                />
              </div>

              <div className={styles.imageField}>
                <span className={styles.imageLabel}>Back</span>
                {backImage ? (
                  <div className={styles.imagePreview}>
                    <img src={backImage} alt="Back of card" />
                    <button
                      type="button"
                      className={styles.imageRemoveBtn}
                      onClick={() => setBackImage(null)}
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.uploadBtn}
                    onClick={() => backInputRef.current?.click()}
                    disabled={uploadingBack}
                  >
                    <span className={styles.uploadIcon}>+</span>
                    <span>{uploadingBack ? "Uploading..." : "Add back"}</span>
                  </button>
                )}
                <input
                  ref={backInputRef}
                  type="file"
                  accept={acceptStr}
                  onChange={(e) => handleFileChange(e, "back")}
                  className={styles.hiddenInput}
                />
              </div>
            </div>
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
              disabled={loading || isUploading}
            >
              {loading ? "Sending..." : "Send Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
