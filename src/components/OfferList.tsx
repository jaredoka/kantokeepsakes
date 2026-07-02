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

interface Thread {
  root: OfferWithProfile;
  turns: OfferWithProfile[]; // chronological
  latest: OfferWithProfile;
}

/** A turn is owner-authored iff author_id is set and differs from the
 *  offerer (offerer_id stays the non-owner party on every turn). */
function authoredByOwner(o: OfferWithProfile): boolean {
  return !!o.author_id && o.author_id !== o.offerer_id;
}

/** Group offer rows into negotiation threads via parent_offer_id chains. */
function buildThreads(offers: OfferWithProfile[]): Thread[] {
  const byId = new Map(offers.map((o) => [o.id, o]));
  const childOf = new Map<string, OfferWithProfile>();
  const roots: OfferWithProfile[] = [];
  for (const o of offers) {
    if (o.parent_offer_id && byId.has(o.parent_offer_id)) {
      childOf.set(o.parent_offer_id, o);
    } else {
      roots.push(o);
    }
  }
  return roots.map((root) => {
    const turns = [root];
    let cur = root;
    while (childOf.has(cur.id)) {
      cur = childOf.get(cur.id)!;
      turns.push(cur);
    }
    return { root, turns, latest: turns[turns.length - 1] };
  });
}

export default function OfferList({ listingId, isOwner }: OfferListProps) {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [counteringId, setCounteringId] = useState<string | null>(null);
  const [counterText, setCounterText] = useState("");
  const [error, setError] = useState("");

  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchOffers() {
      try {
        const res = await fetch(`/api/offers?listingId=${listingId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setOffers(data);
        }
      } catch {
        // silent fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchOffers();
    return () => {
      cancelled = true;
    };
  }, [listingId, refresh]);

  async function respond(
    offerId: string,
    status: "accepted" | "declined" | "countered",
    message?: string
  ) {
    setRespondingId(offerId);
    setError("");

    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message ? { status, message } : { status }),
      });

      if (res.ok) {
        setCounteringId(null);
        setCounterText("");
        setRefresh((r) => r + 1);
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

  const threads = buildThreads(offers);
  const hasAccepted = offers.some((o) => o.status === "accepted");

  const authorLabel = (turn: OfferWithProfile, thread: Thread) => {
    if (authoredByOwner(turn)) return isOwner ? "You" : "Listing owner";
    return isOwner ? thread.root.profiles?.username || "Trader" : "You";
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.heading}>
        Offers <span className={styles.offerCount}>({threads.length})</span>
      </h3>

      {error && <span className={styles.error}>{error}</span>}

      {threads.length === 0 ? (
        <div className={styles.empty}>No offers yet.</div>
      ) : (
        <div className={styles.list}>
          {threads.map((thread) => {
            const { root, turns, latest } = thread;
            const profile = root.profiles;
            const statusClass =
              latest.status === "accepted"
                ? styles.statusAccepted
                : latest.status === "declined"
                  ? styles.statusDeclined
                  : styles.statusPending;
            const myTurn =
              latest.status === "pending" &&
              !hasAccepted &&
              (isOwner ? !authoredByOwner(latest) : authoredByOwner(latest));
            const waiting = latest.status === "pending" && !hasAccepted && !myTurn;

            return (
              <div key={root.id} className={styles.offerCard}>
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
                      {latest.status}
                    </span>
                    <span className={styles.offerDate}>
                      {formatTimeAgo(latest.created_at)}
                    </span>
                  </div>
                </div>

                {turns.map((turn, i) => (
                  <div
                    key={turn.id}
                    className={`${styles.turn} ${authoredByOwner(turn) ? styles.turnOwner : ""}`}
                  >
                    {turns.length > 1 && (
                      <div className={styles.turnMeta}>
                        <span className={styles.turnAuthor}>
                          {i === 0 ? "Offer" : "Counter"} &middot;{" "}
                          {authorLabel(turn, thread)}
                        </span>
                        <span className={styles.turnDate}>
                          {formatTimeAgo(turn.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={styles.offerMessage}>{turn.message}</div>
                    {i === 0 && (turn.front_image || turn.back_image) && (
                      <div className={styles.offerImages}>
                        {turn.front_image && (
                          <div>
                            <div className={styles.offerImage}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={turn.front_image} alt="Front of card" />
                            </div>
                            <div className={styles.offerImageLabel}>Front</div>
                          </div>
                        )}
                        {turn.back_image && (
                          <div>
                            <div className={styles.offerImage}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={turn.back_image} alt="Back of card" />
                            </div>
                            <div className={styles.offerImageLabel}>Back</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {waiting && (
                  <div className={styles.waitingHint}>
                    Waiting for {isOwner ? profile?.username || "the trader" : "the listing owner"} to
                    respond.
                  </div>
                )}

                {myTurn && counteringId !== latest.id && (
                  <div className={styles.offerActions}>
                    <button
                      className={styles.acceptBtn}
                      onClick={() => respond(latest.id, "accepted")}
                      disabled={respondingId === latest.id}
                    >
                      {respondingId === latest.id ? "..." : "Accept"}
                    </button>
                    <button
                      className={styles.declineBtn}
                      onClick={() => respond(latest.id, "declined")}
                      disabled={respondingId === latest.id}
                    >
                      Decline
                    </button>
                    <button
                      className={styles.counterBtn}
                      onClick={() => {
                        setCounteringId(latest.id);
                        setCounterText("");
                        setError("");
                      }}
                      disabled={respondingId === latest.id}
                    >
                      Counter
                    </button>
                  </div>
                )}

                {myTurn && counteringId === latest.id && (
                  <div className={styles.counterForm}>
                    <textarea
                      className={styles.counterTextarea}
                      value={counterText}
                      onChange={(e) => setCounterText(e.target.value)}
                      placeholder="Your counteroffer — e.g. add a card, adjust the cash amount..."
                      maxLength={1000}
                      rows={3}
                    />
                    <div className={styles.offerActions}>
                      <button
                        className={styles.acceptBtn}
                        onClick={() => respond(latest.id, "countered", counterText.trim())}
                        disabled={respondingId === latest.id || !counterText.trim()}
                      >
                        {respondingId === latest.id ? "..." : "Send counter"}
                      </button>
                      <button
                        className={styles.declineBtn}
                        onClick={() => setCounteringId(null)}
                        disabled={respondingId === latest.id}
                      >
                        Cancel
                      </button>
                    </div>
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
