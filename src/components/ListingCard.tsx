"use client";

import Link from "next/link";
import {
  CURRENCY_SYMBOLS,
  type Listing,
  type ListingWithProfile,
} from "@/lib/marketplace/types";
import { getExpiryWarning, getExpiryUrgency } from "@/lib/marketplace/dates";
import { parseGradingTag } from "@/lib/marketplace/grading";
import GradedCardImage from "./GradedCardImage";
import styles from "./ListingCard.module.css";

interface ListingCardProps {
  listing: Listing | ListingWithProfile;
  showStatus?: boolean;
  showActions?: boolean;
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

/** Max visible images per section before showing "+N" overflow */
const MAX_VISIBLE_IMAGES = 10;

export default function ListingCard({
  listing,
  showStatus = false,
  showActions = false,
}: ListingCardProps) {
  const hasProfile = "profiles" in listing && listing.profiles;
  const profile = hasProfile
    ? (listing as ListingWithProfile).profiles
    : null;

  const grading = listing.category === "graded" ? parseGradingTag(listing.title) : null;
  const cellSizeClass = grading
    ? styles.imageCellGraded
    : listing.category === "singles"
      ? styles.imageCellSingles
      : styles.imageCellDefault;

  const hasCash = listing.wants_cash || listing.price !== null;
  const hasOffers = listing.wants_offers;
  const hasSingles = listing.wants_singles;
  const hasGraded = listing.wants_graded;
  const hasSealed = listing.wants_sealed;
  const showFallback = !hasCash && !hasOffers && !hasSingles && !hasGraded && !hasSealed;

  // Haves images to show, with overflow indicator
  const visibleImages = listing.images.slice(0, MAX_VISIBLE_IMAGES);
  const overflowCount = listing.images.length - MAX_VISIBLE_IMAGES;

  // Wants images to show, with overflow indicator
  const wantImages = listing.looking_for_images ?? [];
  const wantVisibleImages = wantImages.slice(0, MAX_VISIBLE_IMAGES);
  const wantOverflowCount = wantImages.length - MAX_VISIBLE_IMAGES;

  // Collect want pills
  const wantPills: { label: string; value?: string }[] = [];
  if (hasCash && listing.price !== null) {
    wantPills.push({
      label: "Cash",
      value: `${CURRENCY_SYMBOLS[listing.currency]}${listing.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
    });
  }
  if (hasOffers) wantPills.push({ label: "Any Offers" });
  if (hasSingles) wantPills.push({ label: "Singles" });
  if (hasGraded) wantPills.push({ label: "Graded" });
  if (hasSealed) wantPills.push({ label: "Sealed" });
  if (showFallback) wantPills.push({ label: "Offers" });

  return (
    <div className={styles.card}>
      <Link href={`/marketplace/${listing.id}`} className={styles.cardLink}>
        {/* Header bar */}
        <div className={styles.headerBar}>
          {profile && (
            <span className={styles.usernamePill}>
              <span className={styles.pillUsername}>{profile.username}</span>
              <span className={styles.pillTrades}>
                · {profile.completed_trades} trade
                {profile.completed_trades !== 1 ? "s" : ""}
              </span>
            </span>
          )}

          <span className={styles.headerTime}>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={styles.clockIcon}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {formatRelativeTime(listing.created_at)}
          </span>

          <div className={styles.headerStatus}>
            {showStatus && listing.status !== "active" ? (
              <span
                className={`${styles.statusBadge} ${listing.status === "sold" ? styles.statusSold : styles.statusExpired}`}
              >
                {listing.status}
              </span>
            ) : (
              <>
                <span className={styles.activeDot} />
                <span className={styles.activeLabel}>Active</span>
              </>
            )}
          </div>
        </div>

        {/* Body: Haves images + Wants pills */}
        <div className={styles.body}>
          {/* Haves — image grid */}
          <div className={styles.havesPanel}>
            <span className={styles.colLabel}>Haves</span>
            <div className={styles.imageGrid}>
              {visibleImages.length > 0 ? (
                visibleImages.map((url, i) => (
                  <div key={i} className={`${styles.imageCell} ${cellSizeClass}`}>
                    {grading ? (
                      <GradedCardImage src={url} alt={`Card ${i + 1}`} grading={grading} size="sm" />
                    ) : (
                      <img
                        src={url}
                        alt={`Card ${i + 1}`}
                        className={styles.cardImg}
                        loading="lazy"
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className={`${styles.imageCell} ${cellSizeClass}`}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
              )}
              {overflowCount > 0 && (
                <div className={styles.overflowCell}>
                  +{overflowCount}
                </div>
              )}
            </div>
          </div>

          {/* Wants — thumbnails + pills */}
          <div className={styles.wantsPanel}>
            <span className={styles.colLabel}>Wants</span>
            {wantVisibleImages.length > 0 && (
              <div className={styles.imageGrid}>
                {wantVisibleImages.map((url, i) => (
                  <div key={i} className={`${styles.imageCell} ${styles.imageCellSingles}`}>
                    <img
                      src={url}
                      alt={`Want ${i + 1}`}
                      className={styles.cardImg}
                      loading="lazy"
                    />
                  </div>
                ))}
                {wantOverflowCount > 0 && (
                  <div className={styles.overflowCell}>
                    +{wantOverflowCount}
                  </div>
                )}
              </div>
            )}
            <div className={`${styles.wantPills} ${wantVisibleImages.length > 0 ? styles.wantPillsWithImages : ""}`}>
              {wantPills.map((pill) => (
                <span key={pill.label} className={styles.wantPill}>
                  {pill.label}
                  {pill.value && (
                    <span className={styles.wantPillValue}>{pill.value}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>

      {/* Owner actions footer */}
      {showActions && listing.status === "active" && (
        <div className={styles.ownerFooter}>
          {(() => {
            const warning = getExpiryWarning(listing.expires_at);
            const urgency = getExpiryUrgency(listing.expires_at);
            if (!warning) return null;
            return (
              <span
                className={`${styles.expiryBadge} ${urgency === "critical" ? styles.expiryCritical : styles.expiryWarn}`}
              >
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
