/**
 * Have/Want matching (G2) — "find trades for me".
 *
 * Card identity is derived from the image URLs already stored on listings:
 * both image sources are our own CDNs with identity encoded in the path —
 *   TCGdex:        https://assets.tcgdex.net/{lang}/{serie}/{set}/{localId}/high.webp
 *   pokemontcg.io: https://images.pokemontcg.io/{ptcgioSetId}/{number}.png
 * so no schema change is needed and every existing listing is matchable.
 * pokemontcg.io set IDs are normalized back to TCGdex IDs via PTCGIO_SET_MAP
 * so the same card gets the same key regardless of which CDN served it.
 *
 * A card key is `{lang}:{tcgdexSetId}:{number}` (leading zeros stripped),
 * e.g. "en:svp:85". Matching is exact — same card, same language.
 */
import { PTCGIO_SET_MAP } from "./cardData";

// Inverted map: pokemontcg.io set ID -> TCGdex set ID
const TCGDEX_BY_PTCGIO: Record<string, string> = Object.fromEntries(
  Object.entries(PTCGIO_SET_MAP).map(([tcgdex, ptcgio]) => [ptcgio, tcgdex])
);

function normNumber(s: string): string {
  return s.replace(/^0+(?=\d)/, "");
}

/** Derive a card identity key from a stored listing image URL, or null for
 *  non-card images (uploads, placeholders). */
export function cardKeyFromUrl(url: string): string | null {
  let m = url.match(
    /^https:\/\/assets\.tcgdex\.net\/([a-z]{2})\/[^/]+\/([^/]+)\/([^/]+?)(?:\/(?:high|low)\.(?:webp|png|jpe?g))?$/
  );
  if (m) return `${m[1]}:${m[2]}:${normNumber(m[3])}`;

  m = url.match(
    /^https:\/\/images\.pokemontcg\.io\/([^/]+)\/([A-Za-z0-9]+?)(?:_hires)?\.png$/
  );
  if (m) {
    const setId = TCGDEX_BY_PTCGIO[m[1]] ?? m[1];
    return `en:${setId}:${normNumber(m[2])}`;
  }

  return null;
}

/** Map image URLs to card keys, keeping the URL for display. */
function keyed(urls: string[]): { url: string; key: string }[] {
  const out: { url: string; key: string }[] = [];
  for (const url of urls || []) {
    const key = cardKeyFromUrl(url);
    if (key) out.push({ url, key });
  }
  return out;
}

/** The minimal listing shape matching operates on. */
export interface MatchableListing {
  id: string;
  images: string[];
  looking_for_images: string[];
}

export interface ListingMatch<T extends MatchableListing> {
  listing: T;
  /** Their have-images that appear in my wants (URLs, for thumbnails) */
  theyHaveIWant: string[];
  /** Their want-images that appear in my haves */
  theyWantIHave: string[];
  /** Both directions matched — a true trade fit */
  twoWay: boolean;
  score: number;
}

/**
 * Match one of my listings against candidate listings (already filtered to
 * active, not mine). Returns matches sorted best-first: two-way fits before
 * one-way, then by number of matched cards.
 */
export function matchListing<T extends MatchableListing>(
  mine: MatchableListing,
  candidates: T[]
): ListingMatch<T>[] {
  const myHaveKeys = new Set(keyed(mine.images).map((k) => k.key));
  const myWantKeys = new Set(keyed(mine.looking_for_images).map((k) => k.key));
  if (myHaveKeys.size === 0 && myWantKeys.size === 0) return [];

  const matches: ListingMatch<T>[] = [];
  for (const c of candidates) {
    const seenHave = new Set<string>();
    const theyHaveIWant = keyed(c.images)
      .filter(({ key }) => {
        if (!myWantKeys.has(key) || seenHave.has(key)) return false;
        seenHave.add(key);
        return true;
      })
      .map(({ url }) => url);

    const seenWant = new Set<string>();
    const theyWantIHave = keyed(c.looking_for_images)
      .filter(({ key }) => {
        if (!myHaveKeys.has(key) || seenWant.has(key)) return false;
        seenWant.add(key);
        return true;
      })
      .map(({ url }) => url);

    if (theyHaveIWant.length === 0 && theyWantIHave.length === 0) continue;

    const twoWay = theyHaveIWant.length > 0 && theyWantIHave.length > 0;
    matches.push({
      listing: c,
      theyHaveIWant,
      theyWantIHave,
      twoWay,
      score: (twoWay ? 100 : 0) + theyHaveIWant.length + theyWantIHave.length,
    });
  }

  return matches.sort((a, b) => b.score - a.score);
}
