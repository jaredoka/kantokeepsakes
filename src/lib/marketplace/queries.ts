import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingWithProfile } from "./types";

export interface ListingFilters {
  priceMin?: number;
  priceMax?: number;
  sort?: "newest" | "oldest" | "price_asc" | "price_desc";
  search?: string;
  country?: string;
  state?: string;
  page?: number;
  perPage?: number;
}

export async function fetchListings(
  supabase: SupabaseClient,
  filters: ListingFilters
): Promise<{ listings: ListingWithProfile[]; total: number }> {
  const {
    priceMin,
    priceMax,
    sort = "newest",
    search,
    country,
    state,
    page = 1,
    perPage = 24,
  } = filters;

  let query = supabase
    .from("listings")
    .select(
      "*, profiles!listings_user_id_fkey(username, reputation_score, completed_trades)",
      { count: "exact" }
    )
    .eq("status", "active");

  if (priceMin !== undefined) {
    query = query.gte("price", priceMin);
  }

  if (priceMax !== undefined) {
    query = query.lte("price", priceMax);
  }

  if (country) {
    query = query.eq("country", country);
  }

  if (state) {
    query = query.eq("state", state);
  }

  if (search && search.trim()) {
    // Use Postgres full-text search on title
    query = query.ilike("title", `%${search.trim()}%`);
  }

  // Sort
  switch (sort) {
    case "oldest":
      query = query.order("bumped_at", { ascending: true });
      break;
    case "price_asc":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false, nullsFirst: true });
      break;
    case "newest":
    default:
      query = query.order("bumped_at", { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching listings:", error);
    return { listings: [], total: 0 };
  }

  return {
    listings: (data as ListingWithProfile[]) || [],
    total: count ?? 0,
  };
}
