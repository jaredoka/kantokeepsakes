"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { ListingFilters } from "@/lib/marketplace/queries";
import styles from "./FilterBar.module.css";

interface FilterBarProps {
  filters: ListingFilters;
  basePath?: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
] as const;

export default function FilterBar({ filters, basePath }: FilterBarProps) {
  const router = useRouter();
  const rawPathname = usePathname();
  const pathname = basePath || rawPathname;
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(filters.search || "");

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Reset page to 1 when changing filters
      params.delete("page");

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput.trim() || undefined });
  };

  const clearFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  const hasFilters = !!(
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.search
  );

  return (
    <div className={styles.bar}>
      {/* Search */}
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search listings..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className={styles.searchBtn}>
          Search
        </button>
      </form>

      {/* Sort */}
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Sort</span>
        <select
          className={styles.select}
          value={filters.sort || "newest"}
          onChange={(e) => updateParams({ sort: e.target.value === "newest" ? undefined : e.target.value })}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button className={styles.clearBtn} onClick={clearFilters}>
          Clear filters
        </button>
      )}
    </div>
  );
}
