"use client";

import { useState } from "react";
import FilterBar from "@/components/FilterBar";
import type { ListingFilters } from "@/lib/marketplace/queries";
import styles from "./MobileFilterSection.module.css";

interface MobileFilterSectionProps {
  filters: ListingFilters;
  basePath: string;
  activeFilterCount: number;
  country?: string;
}

export default function MobileFilterSection({
  filters,
  basePath,
  activeFilterCount,
  country,
}: MobileFilterSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.filtersBtn} ${activeFilterCount > 0 ? styles.filtersBtnActive : ""}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
        </svg>
        Filters
        {activeFilterCount > 0 && (
          <span className={styles.badge}>{activeFilterCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.filterPanel}>
          <FilterBar filters={filters} basePath={basePath} country={country} />
        </div>
      )}
    </div>
  );
}
