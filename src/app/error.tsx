"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.icon}>
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
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className={styles.heading}>Something went wrong</h1>
        <p className={styles.text}>
          An unexpected error occurred. Please try again or return to the
          homepage.
        </p>
        <div className={styles.actions}>
          <button onClick={reset} className={styles.btnPrimary}>
            Try again
          </button>
          <a href="/" className={styles.btnSecondary}>
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
