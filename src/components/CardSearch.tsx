"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  MAX_IMAGES,
  GRADING_COMPANIES,
  PSA_GRADES,
  CGC_GRADES,
  BGS_GRADES,
  WANT_ITEM_TYPES,
  WANT_ITEM_TYPE_LABELS,
  type HaveImage,
  type WantItem,
  type GradingCompany,
  type WantItemType,
} from "@/lib/marketplace/types";
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

// "have" mode props
interface HaveModeProps {
  mode: "have";
  haveImages: HaveImage[];
  onHaveImagesChange: (images: HaveImage[]) => void;
  wantItems?: never;
  onWantItemsChange?: never;
}

// "want" mode props
interface WantModeProps {
  mode: "want";
  wantItems: WantItem[];
  onWantItemsChange: (items: WantItem[]) => void;
  haveImages?: never;
  onHaveImagesChange?: never;
}

type CardSearchProps = (HaveModeProps | WantModeProps) & {
  max?: number;
};

function getGradeOptions(grader: GradingCompany) {
  if (grader === "PSA") return PSA_GRADES;
  if (grader === "CGC") return CGC_GRADES;
  if (grader === "BGS") return BGS_GRADES;
  return null;
}

function getGradeLabel(grader: GradingCompany, grade: string): string {
  if (grader === "RAW") return "RAW";
  if (grader === "SEALED") return "SEALED";
  return `${grader} ${grade}`;
}

export default function CardSearch(props: CardSearchProps) {
  const { mode, max = MAX_IMAGES } = props;

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

  // Per-card grading edit state (have mode)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Get current items list based on mode
  const selectedUrls =
    mode === "have"
      ? props.haveImages.map((img) => img.url)
      : props.wantItems.map((item) => item.url);

  const itemCount =
    mode === "have" ? props.haveImages.length : props.wantItems.length;

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
    setSelectedEra("");
    setSelectedSet("");
    setPromosOnly(false);
    if (query.trim().length >= 2) {
      search(query, newLang, "", "");
    }
  }

  function handleEraChange(eraId: string) {
    setSelectedEra(eraId);
    setSelectedSet("");
    if (query.trim().length >= 2) {
      search(query, lang, "", eraId);
    }
  }

  function handleSetChange(setId: string) {
    setSelectedSet(setId);
    if (query.trim().length >= 2) {
      search(query, lang, setId, selectedEra);
    }
  }

  function handlePromosToggle() {
    const next = !promosOnly;
    setPromosOnly(next);
    setSelectedSet("");
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
    if (selectedUrls.includes(url)) {
      // Deselect
      if (mode === "have") {
        props.onHaveImagesChange(
          props.haveImages.filter((img) => img.url !== url)
        );
      } else {
        props.onWantItemsChange(
          props.wantItems.filter((item) => item.url !== url)
        );
      }
      setEditingIndex(null);
    } else if (itemCount < max) {
      // Select with defaults
      if (mode === "have") {
        props.onHaveImagesChange([
          ...props.haveImages,
          { url, grader: "RAW", grade: "" },
        ]);
      } else {
        props.onWantItemsChange([
          ...props.wantItems,
          { url, type: "singles" },
        ]);
      }
    }
  }

  function removeItem(index: number) {
    if (mode === "have") {
      props.onHaveImagesChange(props.haveImages.filter((_, i) => i !== index));
    } else {
      props.onWantItemsChange(props.wantItems.filter((_, i) => i !== index));
    }
    if (editingIndex === index) setEditingIndex(null);
  }

  // Per-card grading handlers (have mode)
  function handleCardGraderChange(index: number, newGrader: GradingCompany) {
    if (mode !== "have") return;
    const updated = [...props.haveImages];
    const newGrade =
      newGrader === "PSA"
        ? "10"
        : newGrader === "CGC" || newGrader === "BGS"
          ? "9.5"
          : "";
    updated[index] = { ...updated[index], grader: newGrader, grade: newGrade };
    props.onHaveImagesChange(updated);
  }

  function handleCardGradeChange(index: number, newGrade: string) {
    if (mode !== "have") return;
    const updated = [...props.haveImages];
    updated[index] = { ...updated[index], grade: newGrade };
    props.onHaveImagesChange(updated);
  }

  // Per-card type handler (want mode)
  function handleCardTypeChange(index: number, newType: WantItemType) {
    if (mode !== "want") return;
    const updated = [...props.wantItems];
    updated[index] = { ...updated[index], type: newType };
    props.onWantItemsChange(updated);
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
    if (img.src.includes("/ja/")) {
      img.src = img.src.replace("/ja/", "/en/");
    }
    if (card.images.small.includes("/ja/")) {
      card.images.small = card.images.small.replace("/ja/", "/en/");
      card.images.large = card.images.large.replace("/ja/", "/en/");
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* Selected cards with grading/type overlays */}
      {itemCount > 0 && (
        <div className={styles.selected}>
          {mode === "have"
            ? props.haveImages.map((img, i) => (
                <div key={img.url} className={styles.selectedCard}>
                  <img
                    src={img.url}
                    alt={`Selected card ${i + 1}`}
                    className={styles.selectedImg}
                  />
                  {/* Grading badge overlay */}
                  <button
                    type="button"
                    className={styles.gradeBadge}
                    onClick={() =>
                      setEditingIndex(editingIndex === i ? null : i)
                    }
                    title="Click to change grade"
                  >
                    {getGradeLabel(img.grader, img.grade)}
                  </button>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeItem(i)}
                    aria-label={`Remove card ${i + 1}`}
                  >
                    &times;
                  </button>
                  {/* Inline grading picker */}
                  {editingIndex === i && (
                    <div className={styles.gradingPopover}>
                      <div className={styles.gradingPopoverPills}>
                        {GRADING_COMPANIES.map((g) => (
                          <button
                            key={g}
                            type="button"
                            className={`${styles.gradingPopoverPill} ${img.grader === g ? styles.gradingPopoverPillActive : ""}`}
                            onClick={() => handleCardGraderChange(i, g)}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      {getGradeOptions(img.grader) && (
                        <div className={styles.gradingPopoverGrades}>
                          {getGradeOptions(img.grader)!.map((g) => (
                            <button
                              key={g}
                              type="button"
                              className={`${styles.gradingPopoverGradeBtn} ${img.grade === g ? styles.gradingPopoverGradeBtnActive : ""}`}
                              onClick={() => handleCardGradeChange(i, g)}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            : props.wantItems.map((item, i) => (
                <div key={item.url} className={styles.selectedCard}>
                  <img
                    src={item.url}
                    alt={`Wanted card ${i + 1}`}
                    className={styles.selectedImg}
                  />
                  {/* Type badge overlay */}
                  <button
                    type="button"
                    className={styles.typeBadge}
                    onClick={() =>
                      setEditingIndex(editingIndex === i ? null : i)
                    }
                    title="Click to change type"
                  >
                    {WANT_ITEM_TYPE_LABELS[item.type]}
                  </button>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeItem(i)}
                    aria-label={`Remove card ${i + 1}`}
                  >
                    &times;
                  </button>
                  {/* Inline type picker */}
                  {editingIndex === i && (
                    <div className={styles.gradingPopover}>
                      <div className={styles.gradingPopoverPills}>
                        {WANT_ITEM_TYPES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`${styles.gradingPopoverPill} ${item.type === t ? styles.gradingPopoverPillActive : ""}`}
                            onClick={() => handleCardTypeChange(i, t)}
                          >
                            {WANT_ITEM_TYPE_LABELS[t]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
        {itemCount}/{max} selected
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
            const isSelected = selectedUrls.includes(card.images.large);
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
