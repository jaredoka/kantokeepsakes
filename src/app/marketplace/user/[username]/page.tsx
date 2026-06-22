import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import StarRating from "@/components/StarRating";
import ProfileEditForm from "@/components/ProfileEditForm";
import {
  getReputationTier,
  formatAccountAge,
} from "@/lib/marketplace/reputation";
import type { Profile, ListingWithProfile } from "@/lib/marketplace/types";
import styles from "./page.module.css";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

async function getProfile(username: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  return data as Profile | null;
}

async function getUserListings(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("listings")
    .select(
      "*, profiles!listings_user_id_fkey(username, reputation_score, completed_trades)"
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("bumped_at", { ascending: false })
    .limit(12);

  return (data || []) as ListingWithProfile[];
}

async function getUserReviews(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("trade_confirmations")
    .select(
      "*, confirmer:profiles!trade_confirmations_confirmer_id_fkey(username), listings(id, title, type)"
    )
    .eq("confirmed_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data || []) as Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    confirmer: { username: string } | null;
    listings: { id: string; title: string; type: string } | null;
  }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(decodeURIComponent(username));

  if (!profile) {
    return { title: "User Not Found — Kanto Keepsakes" };
  }

  const tier = getReputationTier(profile.completed_trades);

  return {
    title: `${profile.username} — ${tier.label} — Kanto Keepsakes`,
    description: `View ${profile.username}'s profile. ${profile.completed_trades} completed trade${profile.completed_trades !== 1 ? "s" : ""}.`,
  };
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = await getProfile(decodeURIComponent(username));

  if (!profile) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  const [listings, reviews] = await Promise.all([
    getUserListings(profile.id),
    getUserReviews(profile.id),
  ]);

  const tier = getReputationTier(profile.completed_trades);
  const ratingDisplay =
    profile.reputation_score > 0
      ? (profile.reputation_score / 10).toFixed(1)
      : null;
  const ratingValue = profile.reputation_score > 0
    ? Math.round(profile.reputation_score / 10)
    : 0;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Link href="/marketplace" className={styles.backLink}>
          &larr; Back to Marketplace
        </Link>

        {/* Profile header */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            {profile.username.charAt(0).toUpperCase()}
          </div>

          <div className={styles.profileInfo}>
            <h1 className={styles.username}>{profile.username}</h1>
            <span className={`${styles.tierBadge} ${styles[tier.className]}`}>
              {tier.label}
            </span>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {profile.completed_trades}
              </span>
              <span className={styles.statLabel}>
                Trade{profile.completed_trades !== 1 ? "s" : ""}
              </span>
            </div>
            {ratingDisplay && (
              <div className={styles.stat}>
                <span className={styles.statValue}>{ratingDisplay}</span>
                <span className={styles.statLabel}>Rating</span>
              </div>
            )}
            {ratingValue > 0 && (
              <div className={styles.stat}>
                <StarRating value={ratingValue} readonly size="sm" />
              </div>
            )}
          </div>

          <span className={styles.joined}>
            {formatAccountAge(profile.created_at)}
          </span>

          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

          {isOwnProfile && (
            <ProfileEditForm
              currentUsername={profile.username}
              currentBio={profile.bio}
            />
          )}
        </div>

        {/* Active Listings */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>
            Active Listings ({listings.length})
          </h2>

          {listings.length > 0 ? (
            <div className={styles.listingsGrid}>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No active listings.</p>
          )}
        </section>

        {/* Reviews */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>
            Reviews ({reviews.length})
          </h2>

          {reviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {reviews.map((review) => (
                <div key={review.id} className={styles.review}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewUser}>
                      {review.confirmer?.username || "Unknown"}
                    </span>
                    <StarRating value={review.rating} readonly size="sm" />
                    <span className={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {review.listings && (
                    <Link
                      href={`/marketplace/${review.listings.id}`}
                      className={styles.reviewListing}
                    >
                      {review.listings.type}: {review.listings.title}
                    </Link>
                  )}
                  {review.comment && (
                    <p className={styles.reviewComment}>{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No reviews yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
