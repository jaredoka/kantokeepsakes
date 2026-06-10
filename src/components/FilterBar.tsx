"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_LANGUAGES,
  LISTING_TYPE_LABELS,
  CATEGORY_LABELS,
  LANGUAGE_LABELS,
} from "@/lib/marketplace/types";
import type { ListingFilters } from "@/lib/marketplace/queries";
import styles from "./FilterBar.module.css";

interface FilterBarProps {
  filters: ListingFilters;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
] as const;

export default function FilterBar({ filters }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
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

  const toggleParam = useCallback(
    (key: string, value: string) => {
      const current = searchParams.get(key);
      updateParams({ [key]: current === value ? undefined : value });
    },
    [searchParams, updateParams]
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
    filters.type ||
    filters.category ||
    filters.language ||
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

      {/* Type Toggle */}
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Type</span>
        <div className={styles.pills}>
          {LISTING_TYPES.map((t) => (
            <button
              key={t}
              className={`${styles.pill} ${filters.type === t ? styles.pillActive : ""}`}
              onClick={() => toggleParam("type", t)}
            >
              {LISTING_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Category</span>
        <div className={styles.pills}>
          {LISTING_CATEGORIES.map((c) => (
            <button
              key={c}
              className={`${styles.pill} ${filters.category === c ? styles.pillActive : ""}`}
              onClick={() => toggleParam("category", c)}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Language</span>
        <div className={styles.pills}>
          {LISTING_LANGUAGES.map((l) => (
            <button
              key={l}
              className={`${styles.pill} ${filters.language === l ? styles.pillActive : ""}`}
              onClick={() => toggleParam("language", l)}
            >
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>
      </div>

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
