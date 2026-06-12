"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { OfferWithProfile } from "@/lib/marketplace/types";
import { formatTimeAgo } from "@/lib/marketplace/dates";
import styles from "./OfferList.module.css";

interface OfferListProps {
  listingId: string;
  isOwner: boolean;
}

export default function OfferList({ listingId, isOwner }: OfferListProps) {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOffers() {
      try {
        const res = await fetch(`/api/offers?listingId=${listingId}`);
        if (res.ok) {
          const data = await res.json();
          setOffers(data);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, [listingId]);

  async function handleRespond(offerId: string, status: "accepted" | "declined") {
    setRespondingId(offerId);
    setError("");

    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        // Update local state
        setOffers((prev) =>
          prev.map((o) => {
            if (o.id === offerId) return { ...o, status };
            // If accepting one, decline all other pending
            if (status === "accepted" && o.status === "pending") {
              return { ...o, status: "declined" };
            }
            return o;
          })
        );
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to respond.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setRespondingId(null);
    }
  }

  if (loading) return null;
  if (offers.length === 0 && !isOwner) return null;

  const hasAccepted = offers.some((o) => o.status === "accepted");

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.heading}>
        Offers <span className={styles.offerCount}>({offers.length})</span>
      </h3>

      {error && <span className={styles.error}>{error}</span>}

      {offers.length === 0 ? (
        <div className={styles.empty}>No offers yet.</div>
      ) : (
        <div className={styles.list}>
          {offers.map((offer) => {
            const profile = offer.profiles;
            const statusClass =
              offer.status === "accepted"
                ? styles.statusAccepted
                : offer.status === "declined"
                  ? styles.statusDeclined
                  : styles.statusPending;

            return (
              <div key={offer.id} className={styles.offerCard}>
                <div className={styles.offerHeader}>
                  <div className={styles.offererInfo}>
                    <span className={styles.offererName}>
                      {profile?.username || "Unknown"}
                    </span>
                    {profile && (
                      <span className={styles.offererTrades}>
                        {profile.completed_trades} trade
                        {profile.completed_trades !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={`${styles.statusBadge} ${statusClass}`}>
                      {offer.status}
                    </span>
                    <span className={styles.offerDate}>
                      {formatTimeAgo(offer.created_at)}
                    </span>
                  </div>
                </div>

                <div className={styles.offerMessage}>{offer.message}</div>

                {(offer.front_image || offer.back_image) && (
                  <div className={styles.offerImages}>
                    {offer.front_image && (
                      <div>
                        <div className={styles.offerImage}>
                          <img src={offer.front_image} alt="Front of card" />
                        </div>
                        <div className={styles.offerImageLabel}>Front</div>
                      </div>
                    )}
                    {offer.back_image && (
                      <div>
                        <div className={styles.offerImage}>
                          <img src={offer.back_image} alt="Back of card" />
                        </div>
                        <div className={styles.offerImageLabel}>Back</div>
                      </div>
                    )}
                  </div>
                )}

                {isOwner && offer.status === "pending" && !hasAccepted && (
                  <div className={styles.offerActions}>
                    <button
                      className={styles.acceptBtn}
                      onClick={() => handleRespond(offer.id, "accepted")}
                      disabled={respondingId === offer.id}
                    >
                      {respondingId === offer.id ? "..." : "Accept"}
                    </button>
                    <button
                      className={styles.declineBtn}
                      onClick={() => handleRespond(offer.id, "declined")}
                      disabled={respondingId === offer.id}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
