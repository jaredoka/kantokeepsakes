import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const SEARCH_LIMIT = 30; // requests per minute
const SEARCH_WINDOW_MS = 60 * 1000;

const API_BASE = "https://api.pokemontcg.io/v2/cards";
const API_KEY = process.env.POKEMON_TCG_API_KEY;

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
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("pageSize") || "20";

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters." },
      { status: 400 }
    );
  }

  // Build pokemontcg.io query — search by name with wildcard
  const query = `name:"${name}*"`;
  const url = `${API_BASE}?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}&select=id,name,set,images,number,rarity`;

  const headers: Record<string, string> = {};
  if (API_KEY) {
    headers["X-Api-Key"] = API_KEY;
  }

  try {
    const res = await fetch(url, { headers });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to search cards." },
        { status: 502 }
      );
    }

    const data = await res.json();

    // Return simplified card data
    const cards = (data.data || []).map(
      (card: {
        id: string;
        name: string;
        number: string;
        rarity?: string;
        set: { id: string; name: string; series: string };
        images: { small: string; large: string };
      }) => ({
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity || null,
        set: {
          id: card.set.id,
          name: card.set.name,
          series: card.set.series,
        },
        images: {
          small: card.images.small,
          large: card.images.large,
        },
      })
    );

    return NextResponse.json({
      cards,
      totalCount: data.totalCount || 0,
      page: data.page || 1,
      pageSize: data.pageSize || 20,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to card database." },
      { status: 502 }
    );
  }
}
