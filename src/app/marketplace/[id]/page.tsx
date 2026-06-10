import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ImageGallery from "@/components/ImageGallery";
import SellerCard from "@/components/SellerCard";
import ActionBar from "@/components/ActionBar";
import {
  LISTING_TYPE_LABELS,
  CATEGORY_LABELS,
  LANGUAGE_LABELS,
  CURRENCY_SYMBOLS,
  type ListingWithProfile,
} from "@/lib/marketplace/types";
import type { Profile } from "@/lib/marketplace/types";
import styles from "./page.module.css";

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

async function getListing(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      "*, profiles!listings_user_id_fkey(username, reputation_score, completed_trades, created_at)"
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as ListingWithProfile & {
    profiles: Pick<
      Profile,
      "username" | "reputation_score" | "completed_trades" | "created_at"
    >;
  };
}

export async function generateMetadata({
  params,
}: DetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return { title: "Listing Not Found — Kanto Keepsakes" };
  }

  const priceText =
    listing.price !== null
      ? `${CURRENCY_SYMBOLS[listing.currency]}${listing.price}`
      : "Make Offer";

  return {
    title: `${listing.title} — Kanto Keepsakes`,
    description: `${LISTING_TYPE_LABELS[listing.type]} — ${listing.description.slice(0, 160)}`,
    openGraph: {
      title: `${listing.type}: ${listing.title} (${priceText})`,
      description: listing.description.slice(0, 200),
      images: listing.images.length > 0 ? [listing.images[0]] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing || listing.status === "removed") {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === listing.user_id;
  const profile = listing.profiles;

  const isSold = listing.status === "sold";
  const isExpired = listing.status === "expired";

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Link href="/marketplace" className={styles.backLink}>
          &larr; Back to Marketplace
        </Link>

        {(isSold || isExpired) && (
          <div
            className={`${styles.statusBanner} ${isSold ? styles.statusSold : styles.statusExpired}`}
          >
            This listing has been marked as {listing.status}.
          </div>
        )}

        <div className={styles.layout}>
          {/* Left column — images */}
          <div className={styles.leftCol}>
            <ImageGallery images={listing.images} alt={listing.title} />
          </div>

          {/* Right column — details */}
          <div className={styles.rightCol}>
            <div className={styles.typeBadgeRow}>
              <span
                className={`${styles.typeBadge} ${listing.type === "WTB" ? styles.typeBadgeWtb : styles.typeBadgeWts}`}
              >
                {LISTING_TYPE_LABELS[listing.type]}
              </span>
              <span className={styles.meta}>
                {CATEGORY_LABELS[listing.category]}
              </span>
              <span className={styles.metaDot}>&middot;</span>
              <span className={styles.meta}>
                {LANGUAGE_LABELS[listing.language]}
              </span>
            </div>

            <h1 className={styles.title}>{listing.title}</h1>

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

            <div className={styles.description}>
              {listing.description.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            <div className={styles.postedDate}>
              Listed{" "}
              {new Date(listing.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>

            {!isSold && !isExpired && (
              <ActionBar
                listingId={listing.id}
                isOwner={isOwner}
                isAuthenticated={!!user}
              />
            )}

            {isOwner && listing.status === "active" && (
              <Link
                href={`/marketplace/${listing.id}/edit`}
                className={styles.editLink}
              >
                Edit listing
              </Link>
            )}

            {/* Seller card */}
            <SellerCard profile={profile} />
          </div>
        </div>
      </div>
    </main>
  );
}
