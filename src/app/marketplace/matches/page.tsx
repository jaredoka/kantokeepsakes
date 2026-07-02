import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import { matchListing, type ListingMatch } from "@/lib/marketplace/matching";
import type { Listing, ListingWithProfile } from "@/lib/marketplace/types";
import styles from "./page.module.css";

export const metadata = { title: "Matches" };
export const dynamic = "force-dynamic";

/** How many candidate listings to consider per page load */
const CANDIDATE_LIMIT = 500;

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // marketplace layout redirects to login

  const [{ data: myListings }, { data: candidates }] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("listings")
      .select(
        "*, profiles!listings_user_id_fkey(username, reputation_score, completed_trades)"
      )
      .eq("status", "active")
      .neq("user_id", user.id)
      .order("bumped_at", { ascending: false })
      .limit(CANDIDATE_LIMIT),
  ]);

  const mine = (myListings || []) as Listing[];
  const pool = (candidates || []) as ListingWithProfile[];

  const sections = mine
    .map((listing) => ({
      listing,
      matches: matchListing(listing, pool),
    }))
    .filter((s) => s.matches.length > 0);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Matches</h1>
      <p className={styles.subtitle}>
        Listings from other traders whose haves match your wants — and whose
        wants match your haves.
      </p>

      {mine.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            You have no active listings yet. Post what you have and what you
            want, and we&apos;ll surface trades for you.
          </p>
          <Link href="/marketplace/new" className={styles.primaryBtn}>
            Post a listing
          </Link>
        </div>
      ) : sections.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            No matches right now. Matches appear when another trader&apos;s
            listing has a card you want, or wants a card you have — check back
            as new listings are posted.
          </p>
          <Link href="/marketplace/wts" className={styles.primaryBtn}>
            Browse the marketplace
          </Link>
        </div>
      ) : (
        sections.map(({ listing, matches }) => (
          <section key={listing.id} className={styles.section}>
            <h2 className={styles.sectionHead}>
              Matches for{" "}
              <Link
                href={`/marketplace/${listing.id}`}
                className={styles.sectionLink}
              >
                {listing.title}
              </Link>
            </h2>
            <div className={styles.matchGrid}>
              {matches.map((m) => (
                <MatchCell key={m.listing.id} match={m} />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}

function MatchCell({ match }: { match: ListingMatch<ListingWithProfile> }) {
  return (
    <div className={styles.matchCell}>
      <div className={styles.matchInfo}>
        {match.twoWay && (
          <span className={styles.twoWayBadge}>&#8646; Two-way match</span>
        )}
        {match.theyHaveIWant.length > 0 && (
          <div className={styles.chipGroup}>
            <span className={styles.chipLabel}>They have &middot; you want</span>
            {match.theyHaveIWant.slice(0, 6).map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="Matched card" className={styles.cardThumb} />
            ))}
          </div>
        )}
        {match.theyWantIHave.length > 0 && (
          <div className={styles.chipGroup}>
            <span className={styles.chipLabel}>They want &middot; you have</span>
            {match.theyWantIHave.slice(0, 6).map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="Matched card" className={styles.cardThumb} />
            ))}
          </div>
        )}
      </div>
      <ListingCard listing={match.listing} />
    </div>
  );
}
