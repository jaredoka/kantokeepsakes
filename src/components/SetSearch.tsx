"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MAX_IMAGES } from "@/lib/marketplace/types";
import styles from "./SetSearch.module.css";

interface PokemonSet {
  id: string;
  name: string;
  series: string;
  releaseDate: string;
  total: number;
  images: { symbol: string; logo: string };
}

interface SetSearchProps {
  /** Currently selected set image URLs (logos) */
  images: string[];
  /** Called when the selected images change */
  onImagesChange: (images: string[]) => void;
  /** Max number of images allowed (defaults to MAX_IMAGES) */
  max?: number;
}

export default function SetSearch({
  images,
  onImagesChange,
  max = MAX_IMAGES,
}: SetSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PokemonSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent sets on mount
  useEffect(() => {
    loadRecentSets();
  }, []);

  async function loadRecentSets() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pokemon-tcg/sets?pageSize=20");
      if (res.ok) {
        const data = await res.json();
        setResults(data.sets || []);
      }
    } catch {
      // Silently fail for initial load
    } finally {
      setLoading(false);
    }
  }

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length === 0) {
      // Reset to recent sets
      loadRecentSets();
      setSearched(false);
      return;
    }

    if (searchQuery.trim().length < 2) {
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/pokemon-tcg/sets?name=${encodeURIComponent(searchQuery.trim())}&pageSize=30`
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Search failed.");
        setResults([]);
        return;
      }

      const data = await res.json();
      setResults(data.sets || []);
    } catch {
      setError("Failed to search sets.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      search(value);
    }, 400);
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function selectSet(set: PokemonSet) {
    const url = set.images.logo;
    if (images.includes(url)) {
      // Deselect
      onImagesChange(images.filter((img) => img !== url));
    } else if (images.length < max) {
      onImagesChange([...images, url]);
    }
  }

  function removeImage(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  // Map selected URLs back to set data for display
  const selectedSets = images
    .map((url) => {
      const found = results.find((s) => s.images.logo === url);
      return found ? { url, set: found } : { url, set: null };
    });

  return (
    <div className={styles.wrapper}>
      {/* Selected sets */}
      {selectedSets.length > 0 && (
        <div className={styles.selected}>
          {selectedSets.map(({ url, set }, i) => (
            <div key={url} className={styles.selectedSet}>
              <img
                src={url}
                alt={set ? set.name : `Selected set ${i + 1}`}
                className={styles.selectedLogo}
              />
              {set && <span className={styles.selectedName}>{set.name}</span>}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeImage(i)}
                aria-label={`Remove set ${i + 1}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className={styles.searchRow}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className={styles.searchInput}
          placeholder="Search set name (e.g. Prismatic, Surging Sparks)..."
        />
      </div>

      <div className={styles.countLabel}>
        {images.length}/{max} selected
      </div>

      {/* Results */}
      {loading && <div className={styles.loading}>Loading sets...</div>}

      {error && <div className={styles.errorMsg}>{error}</div>}

      {!loading && !error && searched && results.length === 0 && (
        <div className={styles.empty}>No sets found. Try a different name.</div>
      )}

      {!loading && results.length > 0 && (
        <div className={styles.results}>
          {results.map((set) => {
            const isSelected = images.includes(set.images.logo);
            return (
              <button
                key={set.id}
                type="button"
                className={`${styles.resultSet} ${isSelected ? styles.resultSetSelected : ""}`}
                onClick={() => selectSet(set)}
              >
                <img
                  src={set.images.logo}
                  alt={set.name}
                  className={styles.resultLogo}
                  loading="lazy"
                />
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>{set.name}</span>
                  <span className={styles.resultMeta}>
                    {set.series} &middot; {set.total} cards &middot; {set.releaseDate}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!searched && !loading && results.length === 0 && (
        <div className={styles.hint}>
          Recent sets are shown above. Type a set name to search.
        </div>
      )}
    </div>
  );
}
