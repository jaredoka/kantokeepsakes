import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import MobileFilterSection from "./MobileFilterSection";
import type { ListingWithProfile } from "@/lib/marketplace/types";
import { fetchListings, type ListingFilters } from "@/lib/marketplace/queries";
import styles from "./BrowsePage.module.css";

const ITEMS_PER_PAGE = 24;

interface BrowsePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BrowsePage({
  searchParams,
}: BrowsePageProps) {
  const params = await searchParams;

  const basePath = "/marketplace";

  const filters: ListingFilters = {
    priceMin: validNumber(params.priceMin),
    priceMax: validNumber(params.priceMax),
    sort: validSort(params.sort),
    search: typeof params.search === "string" ? params.search.trim() : undefined,
    page: Math.max(1, validNumber(params.page) ?? 1),
    perPage: ITEMS_PER_PAGE,
  };

  const supabase = await createClient();
  const { listings, total } = await fetchListings(supabase, filters);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const activeFilterCount = countActiveFilters(filters);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Marketplace</h1>
          <div className={styles.headerRight}>
            {/* Mobile-only filter toggle */}
            <MobileFilterSection
              filters={filters}
              basePath={basePath}
              activeFilterCount={activeFilterCount}
            />

            <div className={styles.headerActions}>
              {user && (
                <Link href="/marketplace/my-listings" className={styles.secondaryBtn}>
                  My Listings
                </Link>
              )}
              {/* Desktop: text button */}
              <Link href="/marketplace/new" className={`${styles.primaryBtn} ${styles.createBtnDesktop}`}>
                + Create Listing
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Left sidebar — filters (desktop only) */}
          <aside className={styles.sidebar}>
            <FilterBar filters={filters} basePath={basePath} />
          </aside>

          {/* Right — listing content */}
          <section className={styles.content}>
            {listings.length === 0 ? (
              <EmptyState
                hasFilters={hasActiveFilters(filters)}
                basePath={basePath}
              />
            ) : (
              <>
                <p className={styles.resultCount}>
                  {total} listing{total !== 1 ? "s" : ""}
                </p>
                <div className={styles.grid}>
                  {listings.map((listing: ListingWithProfile) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={filters.page!}
                    totalPages={totalPages}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Mobile FAB — create listing */}
      {user && (
        <Link href="/marketplace/new" className={styles.fab} aria-label="Create listing">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      )}
    </main>
  );
}

// --- Param validation helpers ---

function validSort(v: string | string[] | undefined): ListingFilters["sort"] {
  const allowed = ["newest", "oldest", "price_asc", "price_desc"];
  if (typeof v === "string" && allowed.includes(v))
    return v as ListingFilters["sort"];
  return "newest";
}

function validNumber(v: string | string[] | undefined): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number(v);
  if (isNaN(n) || n < 0) return undefined;
  return n;
}

function hasActiveFilters(filters: ListingFilters): boolean {
  return !!(
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.search
  );
}

function countActiveFilters(filters: ListingFilters): number {
  let count = 0;
  if (filters.priceMin !== undefined) count++;
  if (filters.priceMax !== undefined) count++;
  if (filters.search) count++;
  return count;
}
