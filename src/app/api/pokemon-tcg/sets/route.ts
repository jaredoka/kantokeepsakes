import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const SEARCH_LIMIT = 20; // requests per minute
const SEARCH_WINDOW_MS = 60 * 1000;

const TCGDEX_BASE = "https://api.tcgdex.net/v2";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const { success } = await rateLimit(
    `pokemon-tcg-sets:${ip}`,
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

  // Fetch all sets from TCGdex
  const url = `${TCGDEX_BASE}/${lang}/sets`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to search sets." },
        { status: 502 }
      );
    }

    const data = await res.json();

    // TCGdex returns an array of sets
    let sets = (Array.isArray(data) ? data : []).map(
      (set: {
        id: string;
        name: string;
        logo?: string;
        symbol?: string;
        cardCount?: { total: number; official: number };
      }) => ({
        id: set.id,
        name: set.name,
        logo: set.logo ? `${set.logo}.png` : null,
        symbol: set.symbol ? `${set.symbol}.png` : null,
        total: set.cardCount?.total ?? 0,
      })
    );

    // Filter by name if provided
    if (name && name.length >= 2) {
      const nameLower = name.toLowerCase();
      sets = sets.filter((s: { name: string }) =>
        s.name.toLowerCase().includes(nameLower)
      );
    }

    // Reverse so newest sets appear first (TCGdex returns oldest first)
    sets.reverse();

    return NextResponse.json({
      sets,
      totalCount: sets.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to card database." },
      { status: 502 }
    );
  }
}
