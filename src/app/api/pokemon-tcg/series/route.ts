import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const SEARCH_LIMIT = 20; // requests per minute
const SEARCH_WINDOW_MS = 60 * 1000;

const TCGDEX_BASE = "https://api.tcgdex.net/v2";

// Series IDs to exclude (mobile games, not physical TCG)
const EXCLUDED_SERIES = new Set(["tcgp"]);

interface TCGdexSet {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: { total: number; official: number };
}

interface TCGdexSeriesDetail {
  id: string;
  name: string;
  logo?: string;
  sets: TCGdexSet[];
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const { success } = rateLimit(
    `pokemon-tcg-series:${ip}`,
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
  const lang = searchParams.get("lang") === "ja" ? "ja" : "en";

  // Fetch all series from TCGdex
  const listUrl = `${TCGDEX_BASE}/${lang}/series`;

  try {
    const listRes = await fetch(listUrl);

    if (!listRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch series." },
        { status: 502 }
      );
    }

    const seriesList: { id: string; name: string; logo?: string }[] =
      await listRes.json();

    if (!Array.isArray(seriesList)) {
      return NextResponse.json({ series: [] });
    }

    // Filter out excluded series (e.g. TCG Pocket)
    const filteredList = seriesList.filter(
      (s) => !EXCLUDED_SERIES.has(s.id.toLowerCase())
    );

    // Fetch each series detail to get nested sets (parallel)
    const detailResults = await Promise.allSettled(
      filteredList.map(async (s) => {
        const res = await fetch(`${TCGDEX_BASE}/${lang}/series/${s.id}`);
        if (!res.ok) return null;
        return (await res.json()) as TCGdexSeriesDetail;
      })
    );

    const series = detailResults
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter((s): s is TCGdexSeriesDetail => s !== null)
      .map((s) => ({
        id: s.id,
        name: s.name,
        sets: (s.sets || []).map((set) => ({
          id: set.id,
          name: set.name,
          logo: set.logo ? `${set.logo}.png` : null,
          total: set.cardCount?.total ?? 0,
        })),
      }));

    // Reverse so newest eras appear first
    series.reverse();

    return NextResponse.json({ series });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to card database." },
      { status: 502 }
    );
  }
}
