"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./RelistButton.module.css";

interface RelistButtonProps {
  listingId: string;
}

export default function RelistButton({ listingId }: RelistButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRelist() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/listings/${listingId}/relist`, {
        method: "POST",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to relist.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.relistBtn}
        onClick={handleRelist}
        disabled={loading}
      >
        {loading ? "Relisting..." : "Relist This Listing"}
      </button>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
