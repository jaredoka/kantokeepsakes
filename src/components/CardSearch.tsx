"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MAX_IMAGES } from "@/lib/marketplace/types";
import styles from "./CardSearch.module.css";

interface PokemonCard {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  set: { id: string; name: string; series: string };
  images: { small: string; large: string };
}

interface CardSearchProps {
  /** Currently selected card image URLs */
  images: string[];
  /** Called when the selected images change */
  onImagesChange: (images: string[]) => void;
  /** Max number of images allowed (defaults to MAX_IMAGES) */
  max?: number;
}

export default function CardSearch({
  images,
  onImagesChange,
  max = MAX_IMAGES,
}: CardSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/pokemon-tcg/search?name=${encodeURIComponent(searchQuery.trim())}&pageSize=40`
      );

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

  function selectCard(card: PokemonCard) {
    const url = card.images.large;
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

      {/* Search input */}
      <div className={styles.searchRow}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className={styles.searchInput}
          placeholder="Search card name (e.g. Charizard, Pikachu VMAX)..."
        />
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
                title={`${card.name} — ${card.set.name} #${card.number}`}
              >
                <img
                  src={card.images.small}
                  alt={card.name}
                  className={styles.resultImg}
                  loading="lazy"
                />
                <div className={styles.resultName}>{card.name}</div>
                <div className={styles.resultSet}>
                  {card.set.name} #{card.number}
                </div>
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
