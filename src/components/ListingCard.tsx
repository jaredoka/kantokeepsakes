"use client";

import Link from "next/link";
import {
  CATEGORY_LABELS,
  LANGUAGE_LABELS,
  CURRENCY_SYMBOLS,
  type Listing,
  type ListingWithProfile,
} from "@/lib/marketplace/types";
import { getExpiryWarning, getExpiryUrgency } from "@/lib/marketplace/dates";
import styles from "./ListingCard.module.css";

interface ListingCardProps {
  listing: Listing | ListingWithProfile;
  showStatus?: boolean;
  showActions?: boolean;
}

/** Parse a leading [TAG] from a title, e.g. "[PSA10] Charizard …" → { tag: "PSA10", rest: "Charizard …" } */
function parseConditionTag(title: string): { tag: string | null; rest: string } {
  const match = title.match(/^\[([A-Z0-9]+)\]\s*/);
  if (match) return { tag: match[1], rest: title.slice(match[0].length) };
  return { tag: null, rest: title };
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

export default function ListingCard({
  listing,
  showStatus = false,
  showActions = false,
}: ListingCardProps) {
  const hasProfile = "profiles" in listing && listing.profiles;
  const profile = hasProfile
    ? (listing as ListingWithProfile).profiles
    : null;

  const { tag: conditionTag, rest: titleText } = parseConditionTag(listing.title);

  const hasCash = listing.price !== null;
  const hasCards =
    (listing.looking_for_description && listing.looking_for_description.trim()) ||
    (listing.looking_for_images && listing.looking_for_images.length > 0);
  const hasOffers = listing.wants_offers;
  const showFallback = !hasCash && !hasCards && !hasOffers;

  return (
    <div className={styles.card}>
      <Link href={`/marketplace/${listing.id}`} className={styles.cardLink}>
        {/* Header bar — full width */}
        <div className={styles.headerBar}>
          <span
            className={`${styles.typeBadge} ${listing.type === "WTB" ? styles.typeBadgeWtb : styles.typeBadgeWts}`}
          >
            {listing.type}
          </span>

          {profile && (
            <>
              <span className={styles.headerUsername}>{profile.username}</span>
              <span className={styles.headerTrades}>
                {profile.completed_trades} trade
                {profile.completed_trades !== 1 ? "s" : ""}
              </span>
            </>
          )}

          <span className={styles.headerTime}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.clockIcon}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            {formatRelativeTime(listing.created_at)}
          </span>

          <div className={styles.headerStatus}>
            {showStatus && listing.status !== "active" ? (
              <span className={`${styles.statusBadge} ${listing.status === "sold" ? styles.statusSold : styles.statusExpired}`}>
                {listing.status}
              </span>
            ) : (
              <>
                <span className={styles.activeDot}></span>
                <span className={styles.activeLabel}>Active</span>
              </>
            )}
          </div>
        </div>

        {/* Two-column layout: Haves | Arrow | Wants */}
        <div className={styles.columns}>
          {/* Haves card */}
          <div className={styles.havesCard}>
            <span className={styles.colLabel}>Haves</span>
            <div className={styles.haveItem}>
              <div className={styles.thumbWrap}>
                {listing.images.length > 0 ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className={styles.thumb}
                  />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-300)" strokeWidth="1.5" className={styles.placeholderIcon}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="m21 15-5-5L5 21"/>
                  </svg>
                )}
              </div>
              <div className={styles.haveInfo}>
                <span className={styles.haveTitle}>
                  {conditionTag && (
                    <span className={styles.conditionTag}>[{conditionTag}]</span>
                  )}
                  {titleText}
                </span>
                <span className={styles.haveMeta}>
                  {CATEGORY_LABELS[listing.category]}
                  <span className={styles.dot}>&middot;</span>
                  {LANGUAGE_LABELS[listing.language]}
                </span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className={styles.arrowWrap}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className={styles.arrowSvg}>
              <rect x="2" y="11.5" width="16" height="5" rx="2" fill="#374151"/>
              <polygon points="16,4 26,14 16,24" fill="#374151"/>
            </svg>
          </div>

          {/* Wants card */}
          <div className={styles.wantsCard}>
            <span className={styles.colLabel}>Wants</span>
            <div className={styles.wantRows}>
              {hasCash && (
                <div className={styles.wantRow}>
                  <span className={styles.wantLabel}>Cash</span>
                  <span className={styles.wantValue}>
                    {CURRENCY_SYMBOLS[listing.currency]}
                    {listing.price!.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              {hasCards && (
                <div className={styles.wantRow}>
                  <span className={styles.wantLabel}>Trade</span>
                  <span className={styles.wantDesc}>
                    {listing.looking_for_description || "Cards"}
                  </span>
                </div>
              )}

              {(hasOffers || showFallback) && (
                <div className={styles.wantRow}>
                  <span className={styles.wantLabel}>Offers</span>
                  <span className={styles.wantDesc}>Open to offers</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Owner actions footer (only shown for user's own listings) */}
      {showActions && listing.status === "active" && (
        <div className={styles.ownerFooter}>
          {(() => {
            const warning = getExpiryWarning(listing.expires_at);
            const urgency = getExpiryUrgency(listing.expires_at);
            if (!warning) return null;
            return (
              <span className={`${styles.expiryBadge} ${urgency === "critical" ? styles.expiryCritical : styles.expiryWarn}`}>
                {warning}
              </span>
            );
          })()}
          <Link
            href={`/marketplace/${listing.id}/edit`}
            className={styles.editLink}
          >
            Edit
          </Link>
        </div>
      )}
    </div>
  );
}
