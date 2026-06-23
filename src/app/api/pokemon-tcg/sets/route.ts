import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const SEARCH_LIMIT = 20; // requests per minute
const SEARCH_WINDOW_MS = 60 * 1000;

const API_BASE = "https://api.pokemontcg.io/v2/sets";
const API_KEY = process.env.POKEMON_TCG_API_KEY;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const { success } = rateLimit(
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
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("pageSize") || "20";

  // Build query — optionally filter by name
  let url: string;
  if (name && name.length >= 2) {
    const query = `name:"${name}*"`;
    url = `${API_BASE}?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}&orderBy=-releaseDate`;
  } else {
    // Return recent sets if no search query
    url = `${API_BASE}?page=${page}&pageSize=${pageSize}&orderBy=-releaseDate`;
  }

  const headers: Record<string, string> = {};
  if (API_KEY) {
    headers["X-Api-Key"] = API_KEY;
  }

  try {
    const res = await fetch(url, { headers });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to search sets." },
        { status: 502 }
      );
    }

    const data = await res.json();

    // Return simplified set data
    const sets = (data.data || []).map(
      (set: {
        id: string;
        name: string;
        series: string;
        releaseDate: string;
        total: number;
        images: { symbol: string; logo: string };
      }) => ({
        id: set.id,
        name: set.name,
        series: set.series,
        releaseDate: set.releaseDate,
        total: set.total,
        images: {
          symbol: set.images.symbol,
          logo: set.images.logo,
        },
      })
    );

    return NextResponse.json({
      sets,
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
