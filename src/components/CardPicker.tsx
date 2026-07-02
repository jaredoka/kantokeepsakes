"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ERA_DATA,
  JA_SET_MAP,
  PROMO_SETS_BY_ERA,
  ALL_PROMO_SET_IDS,
  SET_RANK,
  expandQuery,
  type CardItem,
} from "@/lib/marketplace/cardData";
import styles from "./CardPicker.module.css";

interface TCGDexCardBrief {
  id?: string;
  localId: string | number;
  name?: string;
  image?: string;
}

interface PickerCard {
  id: string;
  localId: string;
  name: string;
  img: string; // resolved image URL, "" when TCGdex has no scan
  setId: string;
}

interface CardPickerProps {
  onSelectCard: (card: CardItem) => void;
}

const API = "https://api.tcgdex.net/v2";
const MAX_RESULTS = 100;
const PLACEHOLDER_IMG = "/images/card-placeholder.svg";
const NO_CARDS: PickerCard[] = [];

function sortCards(list: PickerCard[]): PickerCard[] {
  return [...list].sort((a, b) => {
    const ra = SET_RANK[a.setId] ?? Number.MAX_SAFE_INTEGER;
    const rb = SET_RANK[b.setId] ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    if (a.setId !== b.setId) return a.setId < b.setId ? -1 : 1;
    const na = parseInt(a.localId, 10);
    const nb = parseInt(b.localId, 10);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
    return a.localId.localeCompare(b.localId);
  });
}

/** Fetch full card lists for one or more sets (set browse / promo browse). */
async function loadSets(setIds: string[], lang: "en" | "ja"): Promise<PickerCard[]> {
  const settled = await Promise.allSettled(
    setIds.map(async (sid) => {
      const r = await fetch(`${API}/${lang}/sets/${encodeURIComponent(sid)}`);
      if (!r.ok) throw new Error(`set ${sid}: ${r.status}`);
      const data = await r.json();
      const serieId: string = data.serie?.id || "";
      return ((data.cards || []) as TCGDexCardBrief[]).map((c): PickerCard => ({
        id: c.id || `${sid}-${c.localId}`,
        localId: String(c.localId),
        name: c.name || "",
        setId: sid,
        img: c.image
          ? `${c.image}/high.webp`
          : serieId
            ? `https://assets.tcgdex.net/${lang}/${serieId}/${sid}/${c.localId}/high.webp`
            : "",
      }));
    })
  );
  const ok = settled.filter(
    (s): s is PromiseFulfilledResult<PickerCard[]> => s.status === "fulfilled"
  );
  if (ok.length === 0) throw new Error("all set fetches failed");
  return sortCards(ok.flatMap((s) => s.value));
}

/** Search cards by name across all sets, optionally restricted to a set of set IDs. */
async function loadSearch(
  query: string,
  lang: "en" | "ja",
  allowedSets: Set<string> | null
): Promise<PickerCard[]> {
  const terms = expandQuery(query);
  const settled = await Promise.allSettled(
    terms.map(async (t) => {
      const r = await fetch(`${API}/${lang}/cards?name=like:${encodeURIComponent(t)}`);
      if (!r.ok) throw new Error(`search: ${r.status}`);
      return (await r.json()) as TCGDexCardBrief[];
    })
  );
  const ok = settled.filter(
    (s): s is PromiseFulfilledResult<TCGDexCardBrief[]> => s.status === "fulfilled"
  );
  if (ok.length === 0) throw new Error("all search fetches failed");
  const seen = new Set<string>();
  const out: PickerCard[] = [];
  for (const s of ok) {
    for (const c of s.value) {
      const id = c.id || "";
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const setId = id.slice(0, id.lastIndexOf("-"));
      if (allowedSets && !allowedSets.has(setId)) continue;
      out.push({
        id,
        localId: String(c.localId ?? ""),
        name: c.name || "",
        setId,
        img: c.image ? `${c.image}/high.webp` : "",
      });
    }
  }
  return sortCards(out);
}

/** All TCGdex set IDs belonging to an era for the given language (incl. promos). */
function eraSetIds(eraId: string, lang: "en" | "ja"): Set<string> {
  const ids = new Set<string>();
  const eraObj = ERA_DATA.find((e) => e.id === eraId);
  if (!eraObj) return ids;
  for (const s of eraObj.sets) {
    if (lang === "ja") {
      for (const jaId of JA_SET_MAP[s.id] ?? []) ids.add(jaId);
    } else {
      ids.add(s.id);
    }
  }
  if (lang === "en") {
    for (const promoId of PROMO_SETS_BY_ERA[eraId] ?? []) ids.add(promoId);
  }
  return ids;
}

export default function CardPicker({ onSelectCard }: CardPickerProps) {
  const [lang, setLang] = useState<"en" | "ja">("en");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // debounced copy of `search`
  const [era, setEra] = useState("");
  const [filterSet, setFilterSet] = useState("");
  const [cardType, setCardType] = useState<"all" | "card" | "promo">("all");
  const [loaded, setLoaded] = useState<{ key: string; cards: PickerCard[] }>({
    key: "",
    cards: [],
  });
  const [errKey, setErrKey] = useState("");

  const currentEra = ERA_DATA.find((e) => e.id === era);
  const sets = currentEra ? currentEra.sets : [];

  // Debounce the search input so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Decide what to load. Priority: specific set > name search > era promos.
  // The key identifies the fetch so client-side filter changes (type pills,
  // within-set search text) don't refetch already-loaded data.
  const plan = useMemo<
    | { kind: "sets"; ids: string[]; key: string }
    | { kind: "search"; q: string; key: string }
    | { kind: "notice"; msg: string; key: string }
  >(() => {
    const q = query.trim();
    if (filterSet) {
      const ids = lang === "ja" ? JA_SET_MAP[filterSet] ?? [] : [filterSet];
      return ids.length > 0
        ? { kind: "sets", ids, key: `sets:${lang}:${ids.join(",")}` }
        : { kind: "notice", msg: "No Japanese card data for this set yet.", key: "" };
    }
    if (q) {
      return { kind: "search", q, key: `search:${lang}:${era}:${q}` };
    }
    if (era && cardType === "promo") {
      const ids = lang === "ja" ? [] : PROMO_SETS_BY_ERA[era] ?? [];
      return ids.length > 0
        ? { kind: "sets", ids, key: `sets:${lang}:${ids.join(",")}` }
        : {
            kind: "notice",
            msg:
              lang === "ja"
                ? "Japanese promo data isn't available — try searching by name."
                : "No promo sets for this era.",
            key: "",
          };
    }
    return {
      kind: "notice",
      msg: "Type a card name to search, or pick an era and set to browse.",
      key: "",
    };
  }, [filterSet, lang, era, query, cardType]);

  const notice = plan.kind === "notice" ? plan.msg : null;
  const cards = loaded.key === plan.key ? loaded.cards : NO_CARDS;
  const fetchErr = plan.kind !== "notice" && errKey === plan.key;
  const loading = plan.kind !== "notice" && loaded.key !== plan.key && !fetchErr;

  useEffect(() => {
    if (plan.kind === "notice") return;
    // Already loaded (or failed) for this key — e.g. only a type pill changed
    if (loaded.key === plan.key || errKey === plan.key) return;
    let cancelled = false;
    const { key } = plan;

    const load =
      plan.kind === "sets"
        ? loadSets(plan.ids, lang)
        : loadSearch(plan.q, lang, era ? eraSetIds(era, lang) : null);

    load
      .then((result) => {
        if (!cancelled) setLoaded({ key, cards: result });
      })
      .catch(() => {
        if (!cancelled) setErrKey(key);
      });

    return () => {
      cancelled = true;
    };
  }, [plan, lang, era, loaded.key, errKey]);

  const filtered = useMemo(() => {
    let list = cards;
    // With a specific set loaded, narrow by name in-memory for instant feedback
    if (filterSet && search.trim()) {
      const terms = expandQuery(search);
      list = list.filter((c) =>
        terms.some((t) => c.name.toLowerCase().includes(t))
      );
    }
    if (cardType !== "all") {
      const isPromo = (c: PickerCard) =>
        ALL_PROMO_SET_IDS.has(c.setId) || /^[A-Za-z]/.test(c.localId);
      list = list.filter((c) => (cardType === "promo") === isPromo(c));
    }
    return list;
  }, [cards, filterSet, search, cardType]);

  // Cap broad name searches only — set browsing shows the full set
  const capped = plan.kind === "search";
  const visible = capped ? filtered.slice(0, MAX_RESULTS) : filtered;
  const truncated = capped && filtered.length > MAX_RESULTS;

  function handleEraChange(newEra: string) {
    setEra(newEra);
    setFilterSet("");
  }

  function handleCardClick(card: PickerCard) {
    onSelectCard({
      localId: card.localId,
      name: card.name,
      img: card.img || PLACEHOLDER_IMG,
      set: card.setId,
      lang,
    });
  }

  return (
    <div className={styles.wrapper}>
      {/* Filter bar */}
      <div className={styles.filterBar}>
        {/* Row 1: Language toggle + Search */}
        <div className={styles.filterRow1}>
          <div className={styles.langToggle}>
            {(["en", "ja"] as const).map((id) => (
              <button
                key={id}
                type="button"
                className={`${styles.langBtn} ${lang === id ? styles.langBtnActive : ""}`}
                onClick={() => setLang(id)}
              >
                {id === "en" ? "EN" : "JP"}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search card name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Row 2: Era, Set, Card type */}
        <div className={styles.filterRow2}>
          <select
            value={era}
            onChange={(e) => handleEraChange(e.target.value)}
            className={`${styles.filterSelect} ${styles.eraSelect}`}
          >
            <option value="">All Eras</option>
            {ERA_DATA.map((e) => (
              <option key={e.id} value={e.id}>
                {e.en}
              </option>
            ))}
          </select>
          <select
            value={filterSet}
            onChange={(e) => setFilterSet(e.target.value)}
            disabled={!era}
            className={`${styles.filterSelect} ${styles.setSelect}`}
          >
            <option value="">{era ? "All Sets" : "— Pick era first —"}</option>
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.en}
              </option>
            ))}
          </select>
          <div className={styles.typePills}>
            {([
              { id: "all", label: "All" },
              { id: "card", label: "Cards" },
              { id: "promo", label: "Promos" },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`${styles.typePill} ${cardType === id ? styles.typePillActive : ""}`}
                onClick={() => setCardType(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className={styles.cardGrid}>
        {loading ? (
          <p className={styles.statusMsg}>Loading...</p>
        ) : fetchErr ? (
          <p className={styles.statusMsg}>Card data unavailable. Try again.</p>
        ) : notice ? (
          <p className={styles.statusMsg}>{notice}</p>
        ) : visible.length === 0 ? (
          <p className={styles.statusMsg}>No cards found</p>
        ) : (
          visible.map((card) => (
            <button
              key={card.id}
              type="button"
              title={card.name}
              className={`${styles.cardTile} ${!card.img ? styles.cardTileNoImg : ""}`}
              onClick={() => handleCardClick(card)}
            >
              {card.img ? (
                <img
                  src={card.img}
                  alt={card.name || card.localId}
                  className={styles.cardTileImg}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).parentElement!.style.display = "none";
                  }}
                />
              ) : (
                <span className={styles.cardTileName}>{card.name || card.localId}</span>
              )}
            </button>
          ))
        )}
      </div>
      {truncated && (
        <div className={styles.resultHint}>
          {`Showing first ${MAX_RESULTS} of ${filtered.length} results — refine your search`}
        </div>
      )}
    </div>
  );
}
