"use client";

import Link from "next/link";
import {
  LISTING_TYPE_LABELS,
  CATEGORY_LABELS,
  LANGUAGE_LABELS,
  CURRENCY_SYMBOLS,
  type Listing,
  type ListingWithProfile,
} from "@/lib/marketplace/types";
import styles from "./ListingCard.module.css";

interface ListingCardProps {
  listing: Listing | ListingWithProfile;
  showStatus?: boolean;
  showActions?: boolean;
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

  const statusClass =
    listing.status === "active"
      ? styles.statusActive
      : listing.status === "sold"
        ? styles.statusSold
        : styles.statusOther;

  return (
    <div className={styles.card}>
      <Link href={`/marketplace/${listing.id}`} className={styles.imageLink}>
        {listing.images.length > 0 ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className={styles.image}
          />
        ) : (
          <div className={styles.noImage}>No Image</div>
        )}
        <span
          className={`${styles.typeBadge} ${listing.type === "WTB" ? styles.typeBadgeWtb : styles.typeBadgeWts}`}
        >
          {listing.type}
        </span>
      </Link>

      <div className={styles.body}>
        <Link href={`/marketplace/${listing.id}`} className={styles.titleLink}>
          <h3 className={styles.title}>{listing.title}</h3>
        </Link>

        <div className={styles.meta}>
          <span className={styles.category}>
            {CATEGORY_LABELS[listing.category]}
          </span>
          <span className={styles.dot}>&middot;</span>
          <span className={styles.language}>
            {LANGUAGE_LABELS[listing.language]}
          </span>
        </div>

        <div className={styles.priceRow}>
          {listing.price !== null ? (
            <span className={styles.price}>
              {CURRENCY_SYMBOLS[listing.currency]}
              {listing.price.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
          ) : (
            <span className={styles.makeOffer}>Make Offer</span>
          )}
        </div>

        {profile && (
          <div className={styles.seller}>
            <span className={styles.sellerName}>{profile.username}</span>
            <span className={styles.sellerTrades}>
              {profile.completed_trades} trade
              {profile.completed_trades !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {showStatus && (
          <span className={`${styles.status} ${statusClass}`}>
            {listing.status}
          </span>
        )}

        {showActions && listing.status === "active" && (
          <div className={styles.actions}>
            <Link
              href={`/marketplace/${listing.id}/edit`}
              className={styles.editLink}
            >
              Edit
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
