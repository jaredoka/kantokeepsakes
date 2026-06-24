"use client";

import { useState } from "react";
import type { GradingInfo } from "@/lib/marketplace/grading";
import GradedCardImage from "./GradedCardImage";
import styles from "./ImageGallery.module.css";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  /** When provided, images are wrapped in a graded slab overlay */
  grading?: GradingInfo | null;
}

export default function ImageGallery({ images, alt, grading }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className={styles.noImage}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span>No images</span>
      </div>
    );
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImageWrap}>
        {grading ? (
          <GradedCardImage
            src={images[activeIndex]}
            alt={`${alt} — image ${activeIndex + 1}`}
            grading={grading}
            size="lg"
            className={styles.mainImage}
          />
        ) : (
          <img
            src={images[activeIndex]}
            alt={`${alt} — image ${activeIndex + 1}`}
            className={styles.mainImage}
          />
        )}
      </div>

      {images.length > 1 && (
        <div className={styles.thumbnails}>
          {images.map((src, i) => (
            <button
              key={i}
              className={`${styles.thumb} ${i === activeIndex ? styles.thumbActive : ""}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
            >
              {grading ? (
                <GradedCardImage
                  src={src}
                  alt={`${alt} — thumbnail ${i + 1}`}
                  grading={grading}
                  size="sm"
                  className={styles.thumbImg}
                />
              ) : (
                <img
                  src={src}
                  alt={`${alt} — thumbnail ${i + 1}`}
                  className={styles.thumbImg}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
