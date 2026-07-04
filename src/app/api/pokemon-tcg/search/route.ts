import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const SEARCH_LIMIT = 30; // requests per minute
const SEARCH_WINDOW_MS = 60 * 1000;

const TCGDEX_BASE = "https://api.tcgdex.net/v2";

// Series IDs to exclude (mobile games, not physical TCG)
const EXCLUDED_SERIES = new Set(["tcgp"]);

const HAS_LATIN = /[a-zA-Z]/;

interface RawCard {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

interface MappedCard {
  id: string;
  name: string;
  localId: string;
  images: { small: string; large: string };
}

function mapCard(card: RawCard): MappedCard {
  return {
    id: card.id,
    name: card.name,
    localId: card.localId,
    images: {
      small: `${card.image}/low.webp`,
      large: `${card.image}/high.webp`,
    },
  };
}

/** Convert EN image URLs to JA equivalents */
function enCardToJa(card: MappedCard): MappedCard {
  return {
    ...card,
    id: `ja-${card.id}`,
    images: {
      small: card.images.small.replace("/en/", "/ja/"),
      large: card.images.large.replace("/en/", "/ja/"),
    },
  };
}

/** Merge JA-native and EN-converted results, deduplicating by base ID */
function mergeCards(jaCards: MappedCard[], enCards: MappedCard[]): MappedCard[] {
  const enAsJa = enCards.map(enCardToJa);
  const jaIdSet = new Set(jaCards.map((c) => c.id));
  const merged: MappedCard[] = [...jaCards];
  for (const card of enAsJa) {
    const baseId = card.id.replace("ja-", "");
    if (!jaIdSet.has(baseId)) {
      merged.push(card);
    }
  }
  return merged;
}

/** Check if a card belongs to an excluded series (e.g. TCG Pocket) */
function isExcludedCard(card: RawCard): boolean {
  if (!card.image) return true;
  for (const seriesId of EXCLUDED_SERIES) {
    if (card.image.includes(`/${seriesId}/`)) return true;
  }
  return false;
}

async function fetchCards(
  lang: string,
  name: string,
  page: string,
  pageSize: string
): Promise<MappedCard[]> {
  const url = `${TCGDEX_BASE}/${lang}/cards?name=like:${encodeURIComponent(name)}&pagination:page=${page}&pagination:itemsPerPage=${pageSize}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : [])
    .filter((c: RawCard) => c.image && !isExcludedCard(c))
    .map(mapCard);
}

/** Fetch all cards from a set, filtered by name */
async function fetchSetCards(
  lang: string,
  setId: string,
  name: string
): Promise<RawCard[]> {
  const res = await fetch(
    `${TCGDEX_BASE}/${lang}/sets/${encodeURIComponent(setId)}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  const cards: RawCard[] = data.cards || [];
  const nameLower = name.toLowerCase();
  return cards.filter(
    (c) =>
      c.image &&
      !isExcludedCard(c) &&
      c.name.toLowerCase().includes(nameLower)
  );
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const { success } = await rateLimit(
    `pokemon-tcg-search:${ip}`,
    SEARCH_LIMIT,
    SEARCH_WINDOW_MS
  );

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name")?.trim();
  const lang = searchParams.get("lang") === "ja" ? "ja" : "en";
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("pageSize") || "40";
  const setId = searchParams.get("setId")?.trim();
  const seriesId = searchParams.get("seriesId")?.trim();

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters." },
      { status: 400 }
    );
  }

  // Determine if we should dual-search (JA mode with Latin chars in query)
  const shouldDual = lang === "ja" && HAS_LATIN.test(name);

  // If filtering by specific set, search within that set
  if (setId) {
    return searchBySet(lang, setId, name, Number(page), Number(pageSize), shouldDual);
  }

  // If filtering by era (series), search all sets in that series
  if (seriesId) {
    return searchBySeries(lang, seriesId, name, Number(page), Number(pageSize), shouldDual);
  }

  // JA mode with Latin chars: dual-search both EN and JA endpoints
  if (shouldDual) {
    return dualSearch(name, page, pageSize);
  }

  try {
    const cards = await fetchCards(lang, name, page, pageSize);

    return NextResponse.json({
      cards,
      totalCount: cards.length,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to card database." },
      { status: 502 }
    );
  }
}

/**
 * Search all sets in a series for cards matching the name.
 * When shouldDual is true (JA mode + Latin query), also searches EN endpoint
 * sets and merges results with JA image URLs.
 */
async function searchBySeries(
  lang: string,
  seriesId: string,
  name: string,
  page: number,
  pageSize: number,
  shouldDual: boolean
) {
  try {
    // Fetch series detail to get set IDs
    const seriesRes = await fetch(
      `${TCGDEX_BASE}/${lang}/series/${encodeURIComponent(seriesId)}`
    );
    if (!seriesRes.ok) {
      return NextResponse.json(
        { error: "Series not found." },
        { status: 404 }
      );
    }

    const seriesData = await seriesRes.json();
    const sets: { id: string }[] = seriesData.sets || [];

    if (sets.length === 0) {
      return NextResponse.json({
        cards: [],
        totalCount: 0,
        page,
        pageSize,
      });
    }

    // Search each set in parallel
    const setResults = await Promise.allSettled(
      sets.map((set) => fetchSetCards(lang, set.id, name))
    );

    // Merge all results from JA (or primary lang) sets
    const allMatches: RawCard[] = [];
    for (const result of setResults) {
      if (result.status === "fulfilled") {
        allMatches.push(...result.value);
      }
    }

    let cards = allMatches.map(mapCard);

    // If dual-search enabled, also search EN sets and merge
    if (shouldDual) {
      const enSeriesRes = await fetch(
        `${TCGDEX_BASE}/en/series/${encodeURIComponent(seriesId)}`
      );
      if (enSeriesRes.ok) {
        const enSeriesData = await enSeriesRes.json();
        const enSets: { id: string }[] = enSeriesData.sets || [];
        const enSetResults = await Promise.allSettled(
          enSets.map((set) => fetchSetCards("en", set.id, name))
        );
        const enMatches: RawCard[] = [];
        for (const result of enSetResults) {
          if (result.status === "fulfilled") {
            enMatches.push(...result.value);
          }
        }
        cards = mergeCards(cards, enMatches.map(mapCard));
      }
    }

    // Paginate the merged results
    const start = (page - 1) * pageSize;
    const paged = cards.slice(start, start + pageSize);

    return NextResponse.json({
      cards: paged,
      totalCount: cards.length,
      page,
      pageSize,
      dualSearch: shouldDual,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to card database." },
      { status: 502 }
    );
  }
}

/**
 * Dual-search: search EN endpoint with the query, then convert EN image URLs
 * to JA equivalents. Also search JA endpoint in parallel to catch JA card
 * names containing Latin chars (ex, VSTAR, V). Merge and deduplicate.
 */
async function dualSearch(name: string, page: string, pageSize: string) {
  try {
    const [enCards, jaCards] = await Promise.all([
      fetchCards("en", name, page, pageSize),
      fetchCards("ja", name, page, pageSize),
    ]);

    const merged = mergeCards(jaCards, enCards);

    return NextResponse.json({
      cards: merged,
      totalCount: merged.length,
      page: Number(page),
      pageSize: Number(pageSize),
      dualSearch: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to card database." },
      { status: 502 }
    );
  }
}

/**
 * Search within a specific set for cards matching the name.
 * When shouldDual is true, also searches the EN version of the set and merges.
 */
async function searchBySet(
  lang: string,
  setId: string,
  name: string,
  page: number,
  pageSize: number,
  shouldDual: boolean
) {
  try {
    const filtered = await fetchSetCards(lang, setId, name);
    let cards = filtered.map(mapCard);

    // If dual-search enabled, also search EN set and merge
    if (shouldDual) {
      const enFiltered = await fetchSetCards("en", setId, name);
      cards = mergeCards(cards, enFiltered.map(mapCard));
    }

    // Paginate
    const start = (page - 1) * pageSize;
    const paged = cards.slice(start, start + pageSize);

    return NextResponse.json({
      cards: paged,
      totalCount: cards.length,
      page,
      pageSize,
      dualSearch: shouldDual,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to card database." },
      { status: 502 }
    );
  }
}
