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
  LISTING_TYPE_LABELS,
  CATEGORY_LABELS,
  LANGUAGE_LABELS,
  CURRENCY_SYMBOLS,
  type ListingWithProfile,
} from "@/lib/marketplace/types";
import type { Profile } from "@/lib/marketplace/types";
import { getExpiryWarning, getExpiryUrgency } from "@/lib/marketplace/dates";
import styles from "./page.module.css";

/** Parse a leading [TAG] from a title, e.g. "[PSA10] Charizard …" */
function parseConditionTag(title: string): { tag: string | null; rest: string } {
  const match = title.match(/^\[([A-Z0-9]+)\]\s*/);
  if (match) return { tag: match[1], rest: title.slice(match[0].length) };
  return { tag: null, rest: title };
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

  const hasLookingFor =
    (listing.looking_for_description && listing.looking_for_description.trim()) ||
    (listing.looking_for_images && listing.looking_for_images.length > 0);

  const backPath = listing.type === "WTB" ? "/marketplace/wtb" : "/marketplace/wts";

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Link href={backPath} className={styles.backLink}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to {listing.type === "WTB" ? "Want to Buy" : "Want to Sell"}
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
            {/* Header: type badge, title, price, meta */}
            <div className={styles.header}>
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

              <h1 className={styles.title}>
                {(() => {
                  const { tag, rest } = parseConditionTag(listing.title);
                  return (
                    <>
                      {tag && <span className={styles.conditionTag}>[{tag}]</span>}
                      {rest}
                    </>
                  );
                })()}
              </h1>

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

              <div className={styles.postedDate}>
                Listed{" "}
                {new Date(listing.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Images */}
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>
                {listing.type === "WTS" ? "For Sale" : "Want to Buy"}
              </h2>
              <ImageGallery images={listing.images} alt={listing.title} />
            </div>

            {/* Description */}
            <div className={styles.description}>
              {listing.description.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {/* Looking for section */}
            {hasLookingFor && (
              <div className={styles.section}>
                <h2 className={styles.sectionHeading}>Looking For</h2>
                {listing.looking_for_images && listing.looking_for_images.length > 0 && (
                  <ImageGallery
                    images={listing.looking_for_images}
                    alt="Looking for reference"
                  />
                )}
                {listing.looking_for_description && (
                  <div className={styles.description}>
                    {listing.looking_for_description.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                )}
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
                listingType={listing.type}
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
          </div>
        </div>
      </div>
    </main>
  );
}
