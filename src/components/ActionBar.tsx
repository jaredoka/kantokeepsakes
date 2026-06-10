"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ActionBar.module.css";

interface ActionBarProps {
  listingId: string;
  isOwner: boolean;
  isAuthenticated: boolean;
}

export default function ActionBar({
  listingId,
  isOwner,
  isAuthenticated,
}: ActionBarProps) {
  const router = useRouter();
  const [messaging, setMessaging] = useState(false);

  const handleMessage = useCallback(async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setMessaging(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      if (res.ok) {
        const { id } = await res.json();
        router.push(`/marketplace/inbox/${id}`);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to start conversation.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setMessaging(false);
    }
  }, [listingId, isAuthenticated, router]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/marketplace/${listingId}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  }, [listingId]);

  return (
    <div className={styles.bar}>
      {!isOwner && (
        <button
          className={styles.messageBtn}
          onClick={handleMessage}
          disabled={messaging}
        >
          {messaging ? "Opening..." : "Message Seller"}
        </button>
      )}

      <button className={styles.secondaryBtn} onClick={handleShare}>
        Share
      </button>

      {!isOwner && (
        <button className={styles.reportBtn} disabled title="Coming soon">
          Report
        </button>
      )}
    </div>
  );
}
