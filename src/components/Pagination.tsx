"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./Pagination.module.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(page: number): string {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  // Build page numbers to display
  const pages = buildPageNumbers(currentPage, totalPages);

  return (
    <nav className={styles.nav} aria-label="Pagination">
      {currentPage > 1 ? (
        <Link href={buildHref(currentPage - 1)} className={styles.arrow}>
          &laquo; Prev
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`}>
          &laquo; Prev
        </span>
      )}

      <div className={styles.pages}>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className={styles.ellipsis}>
              ...
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p as number)}
              className={`${styles.page} ${p === currentPage ? styles.pageCurrent : ""}`}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </Link>
          )
        )}
      </div>

      {currentPage < totalPages ? (
        <Link href={buildHref(currentPage + 1)} className={styles.arrow}>
          Next &raquo;
        </Link>
      ) : (
        <span className={`${styles.arrow} ${styles.disabled}`}>
          Next &raquo;
        </span>
      )}
    </nav>
  );
}

function buildPageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) {
    pages.push("...");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  pages.push(total);

  return pages;
}
