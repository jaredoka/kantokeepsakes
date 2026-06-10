import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import type {
  ListingType,
  ListingCategory,
  ListingLanguage,
  ListingWithProfile,
} from "@/lib/marketplace/types";
import { fetchListings, type ListingFilters } from "@/lib/marketplace/queries";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Marketplace — Kanto Keepsakes",
  description:
    "Community-driven Pokemon TCG marketplace — buy, sell, and trade cards with fellow collectors.",
};

const ITEMS_PER_PAGE = 24;

interface MarketplacePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MarketplacePage({
  searchParams,
}: MarketplacePageProps) {
  const params = await searchParams;

  // Parse filters from URL search params
  const filters: ListingFilters = {
    type: validType(params.type),
    category: validCategory(params.category),
    language: validLanguage(params.language),
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

  // Check if user is authenticated (for "Create Listing" button)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Marketplace</h1>
          <div className={styles.headerActions}>
            {user && (
              <Link href="/marketplace/my-listings" className={styles.secondaryBtn}>
                My Listings
              </Link>
            )}
            <Link
              href={user ? "/marketplace/new" : "/login"}
              className={styles.primaryBtn}
            >
              + Create Listing
            </Link>
          </div>
        </div>

        <FilterBar filters={filters} />

        {listings.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters(filters)}
          />
        ) : (
          <>
            <p className={styles.resultCount}>
              {total} listing{total !== 1 ? "s" : ""}
            </p>
            <div className={styles.grid}>
              {listings.map((listing: ListingWithProfile) => (
                <ListingCard key={listing.id} listing={listing} />
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
      </div>
    </main>
  );
}

// --- Param validation helpers ---

function validType(
  v: string | string[] | undefined
): ListingType | undefined {
  if (typeof v === "string" && (v === "WTB" || v === "WTS")) return v;
  return undefined;
}

function validCategory(
  v: string | string[] | undefined
): ListingCategory | undefined {
  const allowed = ["sealed", "singles", "graded", "accessories"];
  if (typeof v === "string" && allowed.includes(v))
    return v as ListingCategory;
  return undefined;
}

function validLanguage(
  v: string | string[] | undefined
): ListingLanguage | undefined {
  const allowed = ["japanese", "english", "any"];
  if (typeof v === "string" && allowed.includes(v))
    return v as ListingLanguage;
  return undefined;
}

function validSort(
  v: string | string[] | undefined
): ListingFilters["sort"] {
  const allowed = ["newest", "oldest", "price_asc", "price_desc"];
  if (typeof v === "string" && allowed.includes(v))
    return v as ListingFilters["sort"];
  return "newest";
}

function validNumber(
  v: string | string[] | undefined
): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number(v);
  if (isNaN(n) || n < 0) return undefined;
  return n;
}

function hasActiveFilters(filters: ListingFilters): boolean {
  return !!(
    filters.type ||
    filters.category ||
    filters.language ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.search
  );
}
