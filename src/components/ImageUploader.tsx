"use client";

import { useState, useRef, useCallback } from "react";
import {
  MAX_IMAGES,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
} from "@/lib/marketplace/types";
import { validateImageFile } from "@/lib/marketplace/validation";
import styles from "./ImageUploader.module.css";

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export default function ImageUploader({
  images,
  onImagesChange,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
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
    },
    []
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);
      const remaining = MAX_IMAGES - images.length;

      if (remaining <= 0) {
        setError(`Maximum ${MAX_IMAGES} images allowed.`);
        return;
      }

      const toUpload = fileArray.slice(0, remaining);
      if (fileArray.length > remaining) {
        setError(
          `Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added.`
        );
      }

      setUploading(true);
      const uploaded: string[] = [];

      for (const file of toUpload) {
        const url = await uploadFile(file);
        if (url) uploaded.push(url);
      }

      if (uploaded.length > 0) {
        onImagesChange([...images, ...uploaded]);
      }
      setUploading(false);
    },
    [images, onImagesChange, uploadFile]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function removeImage(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  const acceptStr = ACCEPTED_IMAGE_TYPES.join(",");

  return (
    <div className={styles.wrapper}>
      {images.length > 0 && (
        <div className={styles.previews}>
          {images.map((url, i) => (
            <div key={url} className={styles.previewItem}>
              <img src={url} alt={`Upload ${i + 1}`} className={styles.previewImg} />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeImage(i)}
                aria-label={`Remove image ${i + 1}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < MAX_IMAGES && (
        <div
          className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ""}`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptStr}
            multiple
            onChange={handleInputChange}
            className={styles.hiddenInput}
            aria-label="Upload images"
          />
          <div className={styles.dropzoneContent}>
            <span className={styles.dropzoneIcon}>+</span>
            <span className={styles.dropzoneText}>
              {uploading
                ? "Uploading..."
                : "Click or drag images here"}
            </span>
            <span className={styles.dropzoneHint}>
              JPEG, PNG, or WebP &middot; Max {MAX_IMAGE_SIZE_MB}MB &middot;{" "}
              {images.length}/{MAX_IMAGES}
            </span>
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
