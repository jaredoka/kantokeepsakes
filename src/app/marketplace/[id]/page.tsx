import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ImageGallery from "@/components/ImageGallery";
import SellerCard from "@/components/SellerCard";
import ActionBar from "@/components/ActionBar";
import BumpButton from "@/components/BumpButton";
import RelistButton from "@/components/RelistButton";
import TradeCompletion from "@/components/TradeCompletion";
import TradeConfirmation from "@/components/TradeConfirmation";
import OfferList from "@/components/OfferList";
import {
  CURRENCY_SYMBOLS,
  type ListingWithProfile,
} from "@/lib/marketplace/types";
import type { Profile } from "@/lib/marketplace/types";
import { getExpiryWarning, getExpiryUrgency } from "@/lib/marketplace/dates";
import styles from "./page.module.css";

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}


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
    return { title: "Listing Not Found" };
  }

  const priceText =
    listing.price !== null
      ? `${CURRENCY_SYMBOLS[listing.currency]}${listing.price}`
      : "Make Offer";

  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: `${listing.title} (${priceText})`,
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

  // Check if there's an accepted offer on this listing
  const { data: acceptedOffer } = await supabase
    .from("offers")
    .select("id")
    .eq("listing_id", listing.id)
    .eq("status", "accepted")
    .limit(1)
    .maybeSingle();

  const hasAcceptedOffer = !!acceptedOffer;

  // Check trade completion status
  let bothCompleted = false;
  if (hasAcceptedOffer) {
    const { data: completions } = await supabase
      .from("trade_completions")
      .select("status")
      .eq("listing_id", listing.id);

    bothCompleted =
      (completions || []).filter(
        (c) => c.status === "completed" || c.status === "auto_completed"
      ).length >= 2;
  }

  const wantTypes: string[] = [];
  if (listing.wants_cash || listing.price !== null) wantTypes.push("Cash");
  if (listing.wants_offers) wantTypes.push("Any Offers");
  if (listing.wants_singles) wantTypes.push("Any Singles");
  if (listing.wants_graded) wantTypes.push("Any Graded");
  if (listing.wants_sealed) wantTypes.push("Any Sealed");

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Link href="/marketplace" className={styles.backLink}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Marketplace
        </Link>

        {(isSold || isExpired) && (
          <div
            className={`${styles.statusBanner} ${isSold ? styles.statusSold : styles.statusExpired}`}
          >
            This listing has been marked as {listing.status}.
          </div>
        )}

        <div className={styles.detailLayout}>
          {/* LEFT COLUMN: lister info, images, description, seller, actions */}
          <div className={styles.leftCol}>
            {/* Header: title, price, meta */}
            <div className={styles.header}>
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

              <div className={styles.statusRow}>
                <svg className={styles.clockIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <span className={styles.postedDate}>
                  {formatTimeAgo(listing.created_at)}
                </span>
                {listing.status === "active" && (
                  <>
                    <span className={styles.statusDot} />
                    <span className={styles.statusActive}>Active</span>
                  </>
                )}
              </div>
            </div>

            {/* Have Images */}
            {listing.images.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionHeading}>Haves</h2>
                <ImageGallery images={listing.images} alt={listing.title} />
              </div>
            )}

            {/* Want Images */}
            {listing.looking_for_images && listing.looking_for_images.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionHeading}>Wants</h2>
                <ImageGallery
                  images={listing.looking_for_images}
                  alt="Wanted cards"
                />
              </div>
            )}

            {/* Description */}
            <div className={styles.descriptionBox}>
              <div className={styles.descriptionBoxLabel}>Description</div>
              <div className={styles.description}>
                {listing.description.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>

            {/* Wants section */}
            {wantTypes.length > 0 && (
              <div className={styles.wantsBox}>
                <div className={styles.wantsBoxLabel}>
                  Trading Preferences
                </div>
                <div className={styles.wantsPills}>
                  {wantTypes.map((w) => (
                    <span key={w} className={styles.wantPill}>
                      {w}
                      {w === "Cash" && listing.price !== null && (
                        <strong className={styles.wantPillValue}>
                          {CURRENCY_SYMBOLS[listing.currency]}
                          {listing.price.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </strong>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Legacy looking-for description (backward compat for old listings) */}
            {listing.looking_for_description && listing.looking_for_description.trim() && (
              <div className={styles.descriptionBox}>
                <div className={styles.descriptionBoxLabel}>Trade Details</div>
                <div className={styles.description}>
                  {listing.looking_for_description.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Expiry warning */}
            {isOwner && listing.status === "active" && (() => {
              const warning = getExpiryWarning(listing.expires_at);
              const urgency = getExpiryUrgency(listing.expires_at);
              if (!warning) return null;
              return (
                <div className={`${styles.expiryWarning} ${urgency === "critical" ? styles.expiryCritical : styles.expiryWarn}`}>
                  {warning}
                </div>
              );
            })()}

            {isOwner && listing.status === "active" && (
              <div className={styles.ownerActions}>
                <Link
                  href={`/marketplace/${listing.id}/edit`}
                  className={styles.editLink}
                >
                  Edit listing
                </Link>
                <BumpButton
                  listingId={listing.id}
                  lastBumpedAt={listing.bumped_at}
                />
              </div>
            )}

            {isOwner && isExpired && (
              <RelistButton listingId={listing.id} />
            )}
          </div>

          {/* RIGHT COLUMN: seller, actions, offers, trade confirmation */}
          <div className={styles.rightCol}>
            {/* Seller card */}
            <SellerCard profile={profile} />

            {/* Actions */}
            {!isSold && !isExpired && !isOwner && (
              <ActionBar
                listingId={listing.id}
                sellerId={listing.user_id}
                isOwner={false}
                isAuthenticated={!!user}
              />
            )}

            {/* Offers — visible to authenticated users */}
            {!!user && (
              <OfferList listingId={listing.id} isOwner={isOwner} />
            )}

            {/* Trade completion — two-step flow */}
            <TradeCompletion
              listingId={listing.id}
              isOwner={isOwner}
              isAuthenticated={!!user}
              isSold={isSold}
              hasAcceptedOffer={hasAcceptedOffer}
              currentUserId={user?.id}
            />

            {/* Trade ratings — gated behind both completions */}
            <TradeConfirmation
              listingId={listing.id}
              isOwner={isOwner}
              isAuthenticated={!!user}
              isSold={isSold}
              hasAcceptedOffer={hasAcceptedOffer}
              bothCompleted={bothCompleted}
            />

            {/* Safe trading tip */}
            <div className={styles.tradingTip}>
              <strong>Safe trading tip:</strong> Always meet in a public place and verify the card before completing the trade.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
