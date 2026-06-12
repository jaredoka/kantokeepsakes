"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import ReportModal from "./ReportModal";
import OfferModal from "./OfferModal";
import styles from "./ActionBar.module.css";

interface ActionBarProps {
  listingId: string;
  sellerId: string;
  isOwner: boolean;
  isAuthenticated: boolean;
}

export default function ActionBar({
  listingId,
  sellerId,
  isOwner,
  isAuthenticated,
}: ActionBarProps) {
  const router = useRouter();
  const [messaging, setMessaging] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showOffer, setShowOffer] = useState(false);

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
          onClick={() => {
            if (!isAuthenticated) {
              router.push("/login");
              return;
            }
            setShowOffer(true);
          }}
        >
          Make Offer
        </button>
      )}

      {!isOwner && (
        <button
          className={styles.secondaryBtn}
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
        <button
          className={styles.reportBtn}
          onClick={() => {
            if (!isAuthenticated) {
              router.push("/login");
              return;
            }
            setShowReport(true);
          }}
        >
          Report
        </button>
      )}

      {showReport && (
        <ReportModal
          reportedUserId={sellerId}
          listingId={listingId}
          onClose={() => setShowReport(false)}
        />
      )}

      {showOffer && (
        <OfferModal
          listingId={listingId}
          onClose={() => setShowOffer(false)}
        />
      )}
    </div>
  );
}
