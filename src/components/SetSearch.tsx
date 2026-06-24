"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MAX_IMAGES } from "@/lib/marketplace/types";
import styles from "./SetSearch.module.css";

interface PokemonSet {
  id: string;
  name: string;
  logo: string | null;
  symbol: string | null;
  total: number;
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
  const [lang, setLang] = useState<"en" | "ja">("en");
  const [results, setResults] = useState<PokemonSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent sets on mount
  useEffect(() => {
    loadRecentSets(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRecentSets(setLang: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pokemon-tcg/sets?lang=${setLang}`);
      if (res.ok) {
        const data = await res.json();
        // Take first 20 (newest) from the reversed list
        setResults((data.sets || []).slice(0, 20));
      }
    } catch {
      // Silently fail for initial load
    } finally {
      setLoading(false);
    }
  }

  const search = useCallback(async (searchQuery: string, searchLang: string) => {
    if (searchQuery.trim().length === 0) {
      loadRecentSets(searchLang);
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
        `/api/pokemon-tcg/sets?name=${encodeURIComponent(searchQuery.trim())}&lang=${searchLang}`
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      search(value, lang);
    }, 400);
  }

  function handleLangChange(newLang: "en" | "ja") {
    setLang(newLang);
    if (query.trim().length >= 2) {
      search(query, newLang);
    } else {
      loadRecentSets(newLang);
    }
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function selectSet(set: PokemonSet) {
    if (!set.logo) return;
    const url = set.logo;
    if (images.includes(url)) {
      onImagesChange(images.filter((img) => img !== url));
    } else if (images.length < max) {
      onImagesChange([...images, url]);
    }
  }

  function removeImage(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  // Map selected URLs back to set data for display
  const selectedSets = images.map((url) => {
    const found = results.find((s) => s.logo && s.logo === url);
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

      {/* Language toggle + Search input */}
      <div className={styles.searchRow}>
        <div className={styles.langToggle}>
          <button
            type="button"
            className={`${styles.langBtn} ${lang === "en" ? styles.langBtnActive : ""}`}
            onClick={() => handleLangChange("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={`${styles.langBtn} ${lang === "ja" ? styles.langBtnActive : ""}`}
            onClick={() => handleLangChange("ja")}
          >
            JA
          </button>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className={styles.searchInput}
          placeholder={lang === "ja"
            ? "Search set name (e.g. \u30B9\u30AB\u30FC\u30EC\u30C3\u30C8, \u30D0\u30A4\u30AA\u30EC\u30C3\u30C8)..."
            : "Search set name (e.g. Prismatic, Surging Sparks)..."
          }
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
            const isSelected = set.logo ? images.includes(set.logo) : false;
            const hasLogo = !!set.logo;
            return (
              <button
                key={set.id}
                type="button"
                className={`${styles.resultSet} ${isSelected ? styles.resultSetSelected : ""} ${!hasLogo ? styles.resultSetDisabled : ""}`}
                onClick={() => selectSet(set)}
                disabled={!hasLogo}
              >
                {hasLogo ? (
                  <img
                    src={set.logo!}
                    alt={set.name}
                    className={styles.resultLogo}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.resultLogoPlaceholder} />
                )}
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>{set.name}</span>
                  <span className={styles.resultMeta}>
                    {set.total} cards{!hasLogo ? " · No logo" : ""}
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
