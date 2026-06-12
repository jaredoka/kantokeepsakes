"use client";

import { useState } from "react";
import styles from "./BumpButton.module.css";

interface BumpButtonProps {
  listingId: string;
  lastBumpedAt: string;
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export default function BumpButton({
  listingId,
  lastBumpedAt,
}: BumpButtonProps) {
  const [loading, setLoading] = useState(false);
  const [bumped, setBumped] = useState(false);
  const [error, setError] = useState("");

  const lastBump = new Date(lastBumpedAt).getTime();
  const canBump = Date.now() - lastBump >= COOLDOWN_MS;

  function getTimeUntilBump(): string {
    const remaining = COOLDOWN_MS - (Date.now() - lastBump);
    if (remaining <= 0) return "";
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  async function handleBump() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/listings/${listingId}/bump`, {
        method: "POST",
      });

      if (res.ok) {
        setBumped(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to bump listing.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (bumped) {
    return <span className={styles.bumpedText}>Listing bumped!</span>;
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.bumpBtn}
        onClick={handleBump}
        disabled={loading || !canBump}
      >
        {loading ? "Bumping..." : "Bump Listing"}
      </button>
      {!canBump && (
        <span className={styles.cooldown}>
          Available in {getTimeUntilBump()}
        </span>
      )}
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
