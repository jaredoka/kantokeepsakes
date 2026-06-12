"use client";

import { useState } from "react";
import styles from "./StarRating.module.css";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div
      className={`${styles.stars} ${styles[size]} ${readonly ? styles.readonly : styles.interactive}`}
      onMouseLeave={() => !readonly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readonly ? star <= value : star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            className={`${styles.star} ${filled ? styles.filled : styles.empty}`}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            disabled={readonly}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
