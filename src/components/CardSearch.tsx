"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MAX_IMAGES } from "@/lib/marketplace/types";
import styles from "./CardSearch.module.css";

interface PokemonCard {
  id: string;
  name: string;
  localId: string;
  images: { small: string; large: string };
}

interface SeriesSet {
  id: string;
  name: string;
  logo: string | null;
  total: number;
}

interface Series {
  id: string;
  name: string;
  sets: SeriesSet[];
}

interface CardSearchProps {
  /** Currently selected card image URLs */
  images: string[];
  /** Called when the selected images change */
  onImagesChange: (images: string[]) => void;
  /** Max number of images allowed (defaults to MAX_IMAGES) */
  max?: number;
}

const HAS_LATIN = /[a-zA-Z]/;

export default function CardSearch({
  images,
  onImagesChange,
  max = MAX_IMAGES,
}: CardSearchProps) {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<"en" | "ja">("en");
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter state
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [selectedEra, setSelectedEra] = useState("");
  const [selectedSet, setSelectedSet] = useState("");
  const [promosOnly, setPromosOnly] = useState(false);

  // Load series on mount and when language changes
  useEffect(() => {
    loadSeries(lang);
  }, [lang]);

  async function loadSeries(seriesLang: string) {
    setSeriesLoading(true);
    try {
      const res = await fetch(`/api/pokemon-tcg/series?lang=${seriesLang}`);
      if (res.ok) {
        const data = await res.json();
        setSeriesList(data.series || []);
      }
    } catch {
      // Silently fail — filters just won't be available
    } finally {
      setSeriesLoading(false);
    }
  }

  const search = useCallback(
    async (
      searchQuery: string,
      searchLang: string,
      setId: string,
      eraId: string
    ) => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        setSearched(false);
        return;
      }

      setLoading(true);
      setError(null);
      setSearched(true);

      try {
        const params = new URLSearchParams({
          name: searchQuery.trim(),
          lang: searchLang,
          pageSize: "40",
        });
        if (setId) {
          params.set("setId", setId);
        } else if (eraId) {
          params.set("seriesId", eraId);
        }

        // Dual-search: JA mode + query has Latin chars + no set/era filter
        const needsDual =
          searchLang === "ja" &&
          HAS_LATIN.test(searchQuery) &&
          !setId &&
          !eraId;
        if (needsDual) params.set("dualLang", "true");

        const res = await fetch(`/api/pokemon-tcg/search?${params}`);

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Search failed.");
          setResults([]);
          return;
        }

        const data = await res.json();
        setResults(data.cards || []);
      } catch {
        setError("Failed to search cards.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  function handleInputChange(value: string) {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      search(value, lang, selectedSet, selectedEra);
    }, 400);
  }

  function handleLangChange(newLang: "en" | "ja") {
    setLang(newLang);
    // Reset filters when language changes (IDs differ between languages)
    setSelectedEra("");
    setSelectedSet("");
    setPromosOnly(false);
    // Re-search with new language if there's a query
    if (query.trim().length >= 2) {
      search(query, newLang, "", "");
    }
  }

  function handleEraChange(eraId: string) {
    setSelectedEra(eraId);
    setSelectedSet(""); // Reset set when era changes
    // Re-search if query exists
    if (query.trim().length >= 2) {
      search(query, lang, "", eraId);
    }
  }

  function handleSetChange(setId: string) {
    setSelectedSet(setId);
    // Re-search with set filter
    if (query.trim().length >= 2) {
      search(query, lang, setId, selectedEra);
    }
  }

  function handlePromosToggle() {
    const next = !promosOnly;
    setPromosOnly(next);
    setSelectedSet(""); // Reset set selection when toggling promos
    if (query.trim().length >= 2) {
      search(query, lang, "", selectedEra);
    }
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function selectCard(card: PokemonCard) {
    const url = card.images.large;
    if (images.includes(url)) {
      onImagesChange(images.filter((img) => img !== url));
    } else if (images.length < max) {
      onImagesChange([...images, url]);
    }
  }

  function removeImage(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  // Compute available sets based on selected era and promo filter
  const availableSets: SeriesSet[] = (() => {
    if (selectedEra) {
      const era = seriesList.find((s) => s.id === selectedEra);
      const sets = era?.sets || [];
      if (promosOnly) {
        return sets.filter(
          (s) =>
            s.id.toLowerCase().endsWith("p") ||
            s.name.toLowerCase().includes("promo")
        );
      }
      return sets;
    }
    if (promosOnly) {
      // Show all promo sets across all eras
      return seriesList.flatMap((era) =>
        era.sets.filter(
          (s) =>
            s.id.toLowerCase().endsWith("p") ||
            s.name.toLowerCase().includes("promo")
        )
      );
    }
    return [];
  })();

  // Handle image load error for cross-language fallback
  function handleImgError(
    e: React.SyntheticEvent<HTMLImageElement>,
    card: PokemonCard
  ) {
    const img = e.currentTarget;
    // If the JA image failed, try EN equivalent
    if (img.src.includes("/ja/")) {
      img.src = img.src.replace("/ja/", "/en/");
    }
    // Also fix the large URL stored in the card reference for selection
    if (card.images.small.includes("/ja/")) {
      card.images.small = card.images.small.replace("/ja/", "/en/");
      card.images.large = card.images.large.replace("/ja/", "/en/");
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* Selected cards */}
      {images.length > 0 && (
        <div className={styles.selected}>
          {images.map((url, i) => (
            <div key={url} className={styles.selectedCard}>
              <img
                src={url}
                alt={`Selected card ${i + 1}`}
                className={styles.selectedImg}
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeImage(i)}
                aria-label={`Remove card ${i + 1}`}
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
          placeholder={
            lang === "ja"
              ? "Search card name (e.g. \u30EA\u30B6\u30FC\u30C9\u30F3, Charizard)..."
              : "Search card name (e.g. Charizard, Pikachu VMAX)..."
          }
        />
      </div>

      {/* Filter row: Era, Set, Promos */}
      <div className={styles.filterRow}>
        <select
          className={styles.filterSelect}
          value={selectedEra}
          onChange={(e) => handleEraChange(e.target.value)}
          disabled={seriesLoading}
        >
          <option value="">All Eras</option>
          {seriesList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={selectedSet}
          onChange={(e) => handleSetChange(e.target.value)}
          disabled={!selectedEra && !promosOnly}
        >
          <option value="">All Sets</option>
          {availableSets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.total})
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`${styles.promoBtn} ${promosOnly ? styles.promoBtnActive : ""}`}
          onClick={handlePromosToggle}
        >
          Promos
        </button>
      </div>

      <div className={styles.countLabel}>
        {images.length}/{max} selected
      </div>

      {/* Results */}
      {loading && <div className={styles.loading}>Searching cards...</div>}

      {error && <div className={styles.errorMsg}>{error}</div>}

      {!loading && !error && searched && results.length === 0 && (
        <div className={styles.empty}>No cards found. Try a different name.</div>
      )}

      {!loading && results.length > 0 && (
        <div className={styles.results}>
          {results.map((card) => {
            const isSelected = images.includes(card.images.large);
            return (
              <button
                key={card.id}
                type="button"
                className={`${styles.resultCard} ${isSelected ? styles.resultCardSelected : ""}`}
                onClick={() => selectCard(card)}
                title={`${card.name} #${card.localId}`}
              >
                <img
                  src={card.images.small}
                  alt={card.name}
                  className={styles.resultImg}
                  loading="lazy"
                  onError={(e) => handleImgError(e, card)}
                />
                <div className={styles.resultName}>{card.name}</div>
              </button>
            );
          })}
        </div>
      )}

      {!searched && !loading && (
        <div className={styles.hint}>
          Type a card name to search the Pokemon TCG database.
        </div>
      )}
    </div>
  );
}
