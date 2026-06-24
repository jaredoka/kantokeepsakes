import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const SEARCH_LIMIT = 30; // requests per minute
const SEARCH_WINDOW_MS = 60 * 1000;

const TCGDEX_BASE = "https://api.tcgdex.net/v2";

// Series IDs to exclude (mobile games, not physical TCG)
const EXCLUDED_SERIES = new Set(["tcgp"]);

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

/** Check if a card belongs to an excluded series (e.g. TCG Pocket) */
function isExcludedCard(card: RawCard): boolean {
  if (!card.image) return true;
  // Image URLs follow pattern: https://assets.tcgdex.net/{lang}/{seriesId}/{setId}/{localId}
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

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const { success } = rateLimit(
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
  const dualLang = searchParams.get("dualLang") === "true";

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters." },
      { status: 400 }
    );
  }

  // If filtering by specific set, search within that set
  if (setId) {
    return searchBySet(lang, setId, name, Number(page), Number(pageSize));
  }

  // If filtering by era (series), search all sets in that series
  if (seriesId) {
    return searchBySeries(lang, seriesId, name, Number(page), Number(pageSize));
  }

  // Dual-search: when lang=ja and query contains Latin chars, search both
  // EN and JA endpoints and merge results with JA image preference
  if (dualLang && lang === "ja") {
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
 * Fetches series detail to get set IDs, then searches each set in parallel.
 */
async function searchBySeries(
  lang: string,
  seriesId: string,
  name: string,
  page: number,
  pageSize: number
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
    const nameLower = name.toLowerCase();
    const setResults = await Promise.allSettled(
      sets.map(async (set) => {
        const res = await fetch(
          `${TCGDEX_BASE}/${lang}/sets/${encodeURIComponent(set.id)}`
        );
        if (!res.ok) return [];
        const data = await res.json();
        const cards: RawCard[] = data.cards || [];
        return cards.filter(
          (c) =>
            c.image &&
            !isExcludedCard(c) &&
            c.name.toLowerCase().includes(nameLower)
        );
      })
    );

    // Merge all results
    const allMatches: RawCard[] = [];
    for (const result of setResults) {
      if (result.status === "fulfilled") {
        allMatches.push(...result.value);
      }
    }

    // Paginate the merged results
    const start = (page - 1) * pageSize;
    const paged = allMatches.slice(start, start + pageSize);

    return NextResponse.json({
      cards: paged.map(mapCard),
      totalCount: allMatches.length,
      page,
      pageSize,
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

    // Convert EN results to JA image URLs (replace /en/ with /ja/ in path)
    const enAsJa: MappedCard[] = enCards.map((card) => ({
      ...card,
      id: `ja-${card.id}`,
      images: {
        small: card.images.small.replace("/en/", "/ja/"),
        large: card.images.large.replace("/en/", "/ja/"),
      },
    }));

    // Build a set of JA card base IDs to deduplicate
    const jaIdSet = new Set(jaCards.map((c) => c.id));

    // Merge: JA-native results first, then EN-converted results (skipping dupes)
    const merged: MappedCard[] = [...jaCards];
    for (const card of enAsJa) {
      const baseId = card.id.replace("ja-", "");
      if (!jaIdSet.has(baseId)) {
        merged.push(card);
      }
    }

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

async function searchBySet(
  lang: string,
  setId: string,
  name: string,
  page: number,
  pageSize: number
) {
  const url = `${TCGDEX_BASE}/${lang}/sets/${encodeURIComponent(setId)}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Set not found." },
        { status: 404 }
      );
    }

    const data = await res.json();
    const allCards: RawCard[] = data.cards || [];

    // Filter by name (case-insensitive partial match)
    const nameLower = name.toLowerCase();
    const filtered = allCards.filter(
      (c) =>
        c.image &&
        !isExcludedCard(c) &&
        c.name.toLowerCase().includes(nameLower)
    );

    // Paginate
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    const cards = paged.map(mapCard);

    return NextResponse.json({
      cards,
      totalCount: filtered.length,
      page,
      pageSize,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to card database." },
      { status: 502 }
    );
  }
}
