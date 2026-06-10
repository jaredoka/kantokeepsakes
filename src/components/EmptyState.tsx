import Link from "next/link";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  hasFilters: boolean;
}

export default function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      {hasFilters ? (
        <>
          <h2 className={styles.heading}>No listings found</h2>
          <p className={styles.text}>
            Try adjusting your filters or search terms.
          </p>
          <Link href="/marketplace" className={styles.btn}>
            Clear all filters
          </Link>
        </>
      ) : (
        <>
          <h2 className={styles.heading}>No listings yet</h2>
          <p className={styles.text}>
            Be the first to post a listing on the marketplace.
          </p>
          <Link href="/marketplace/new" className={styles.btn}>
            Create a listing
          </Link>
        </>
      )}
    </div>
  );
}
