"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { COUNTRIES } from "@/lib/marketplace/cardData";
import styles from "./CountryPill.module.css";

interface CountryPillProps {
  currentCountry?: string;
}

export default function CountryPill({ currentCountry }: CountryPillProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const matched = currentCountry
    ? COUNTRIES.find((c) => c.name === currentCountry)
    : null;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q)) : COUNTRIES;
  }, [query]);

  const selectCountry = useCallback(
    (name: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      params.delete("state");
      params.set("country", name);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
      setOpen(false);
      setQuery("");
    },
    [router, pathname, searchParams]
  );

  const clearCountry = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("country");
    params.delete("state");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
    setQuery("");
  }, [router, pathname, searchParams]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.pill}
        onClick={() => setOpen(!open)}
      >
        {matched ? (
          <>
            <span className={styles.flag}>{matched.flag}</span>
            <span className={styles.name}>{matched.name}</span>
          </>
        ) : (
          <span className={styles.name}>All Countries</span>
        )}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <input
            ref={inputRef}
            type="text"
            className={styles.search}
            placeholder="Search country..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className={styles.list}>
            {currentCountry && (
              <button
                type="button"
                className={styles.option}
                onClick={clearCountry}
              >
                All Countries
              </button>
            )}
            {filtered.length === 0 ? (
              <div className={styles.empty}>No countries found</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`${styles.option} ${currentCountry === c.name ? styles.optionActive : ""}`}
                  onClick={() => selectCountry(c.name)}
                >
                  <span className={styles.optionFlag}>{c.flag}</span>
                  {c.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
