/**
 * Regenerates src/lib/marketplace/cardData.generated.json from the TCGdex API.
 *
 * Run whenever a new set or era releases:
 *   npx tsx scripts/update-card-data.ts
 *
 * Produces:
 *  - eras: curated era grouping (newest first) with each era's sets in
 *    release order, using TCGdex English set names/IDs
 *  - promoSetsByEra: promo sets detected per era (name contains "promo",
 *    plus pinned overrides like the POP Series)
 *  - ptcgioSetMap: TCGdex set ID -> pokemontcg.io set ID, matched by release
 *    date + card count + name and verified with a sample image request.
 *    Used by CardPicker as an image fallback when TCGdex has no scan.
 *
 * The Japanese set mapping (JA_SET_MAP) stays hand-curated in cardData.ts —
 * JP equivalences can't be derived from the API. After adding a new era here,
 * add its JP sets to JA_SET_MAP (release dates usually identify the match:
 * the JP set ships ~2 months before its EN counterpart).
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const TCGDEX = "https://api.tcgdex.net/v2";
const OUT_PATH = resolve(__dirname, "../src/lib/marketplace/cardData.generated.json");

// ── Curation config ──────────────────────────────────────────────────────────

/** Era definitions, newest first. Each era pulls sets from one or more TCGdex series. */
const ERA_DEFS: { id: string; en: string; series: string[] }[] = [
  { id: "mega-evolution", en: "Mega Evolution", series: ["me"] },
  { id: "scarlet-violet", en: "Scarlet & Violet", series: ["sv"] },
  { id: "sword-shield", en: "Sword & Shield", series: ["swsh"] },
  { id: "sun-moon", en: "Sun & Moon", series: ["sm"] },
  { id: "xy", en: "XY", series: ["xy"] },
  { id: "black-white", en: "Black & White", series: ["bw"] },
  { id: "heartgold-soulsilver", en: "HeartGold & SoulSilver", series: ["hgss", "col"] },
  { id: "diamond-pearl", en: "Diamond & Pearl", series: ["dp", "pl"] },
  { id: "ex-series", en: "EX Series", series: ["ex"] },
  { id: "neo", en: "Neo / e-Card", series: ["neo", "ecard"] },
  { id: "original", en: "Original (Wizards)", series: ["base", "gym", "lc"] },
];

// Series intentionally excluded (ERA_DEFS is an allowlist): tcgp (digital-only
// Pokémon TCG Pocket), mc (McDonald's), tk (Trainer Kits), misc. The pop serie
// is pulled in separately via PROMO_OVERRIDES below.

/** Individual sets excluded (oddities that aren't marketplace-relevant). */
const EXCLUDED_SET_IDS = new Set(["sp"]); // Wizards "Sample" set

/** Promo sets that live outside the series above (the POP serie) or whose
 *  serie would place them in the wrong era. */
const PROMO_OVERRIDES: Record<string, string> = {
  np: "ex-series", // Nintendo Black Star Promos
  pop1: "ex-series",
  pop2: "ex-series",
  pop3: "ex-series",
  pop4: "ex-series",
  pop5: "ex-series",
  pop6: "diamond-pearl",
  pop7: "diamond-pearl",
  pop8: "diamond-pearl",
  pop9: "diamond-pearl",
};

const PROMO_NAME_RE = /promo/i;

/** Pinned pokemontcg.io matches the heuristics can't find (promo sets carry
 *  placeholder release dates and lagging card counts over there). Still
 *  verified by the sample-image check below. */
const MANUAL_PTCGIO_MAP: Record<string, string> = {
  svp: "svp", // SVP Black Star Promos
  sve: "sve", // Scarlet & Violet Energies
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return (await r.json()) as T;
}

async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (idx < items.length) {
        const i = idx++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

function normName(n: string): string {
  return n
    .toLowerCase()
    .replace(/black star|promos?|—|–/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface TCGDexSetBrief { id: string; name: string; cardCount?: { total?: number } }
interface TCGDexSerie { id: string; name: string; sets: TCGDexSetBrief[] }
interface TCGDexSetDetail {
  id: string;
  name: string;
  releaseDate?: string;
  cardCount?: { total?: number };
  cards?: { localId: string | number; image?: string }[];
}
interface PtcgioSet { id: string; name: string; releaseDate: string; total: number }

async function main() {
  // 1. Pull every era's series and flatten to ordered set lists
  console.log("Fetching TCGdex series...");
  const eras: { id: string; en: string; sets: { id: string; en: string }[] }[] = [];
  const promoSetsByEra: Record<string, string[]> = {};
  const setEra: Record<string, string> = {};
  const allSets: TCGDexSetBrief[] = [];

  for (const def of ERA_DEFS) {
    const sets: { id: string; en: string }[] = [];
    promoSetsByEra[def.id] = [];
    for (const serieId of def.series) {
      const serie = await getJson<TCGDexSerie>(`${TCGDEX}/en/series/${serieId}`);
      for (const s of serie.sets) {
        if (EXCLUDED_SET_IDS.has(s.id)) continue;
        if (s.id in PROMO_OVERRIDES) continue; // pinned elsewhere
        setEra[s.id] = def.id;
        allSets.push(s);
        if (PROMO_NAME_RE.test(s.name)) {
          promoSetsByEra[def.id].push(s.id);
        } else {
          sets.push({ id: s.id, en: s.name });
        }
      }
    }
    eras.push({ id: def.id, en: def.en, sets });
  }

  // Pinned promo sets (POP serie + overrides)
  const popSerie = await getJson<TCGDexSerie>(`${TCGDEX}/en/series/pop`).catch(() => null);
  const overrideBriefs: TCGDexSetBrief[] = popSerie ? [...popSerie.sets] : [];
  for (const setId of Object.keys(PROMO_OVERRIDES)) {
    if (!overrideBriefs.some((s) => s.id === setId)) {
      const detail = await getJson<TCGDexSetDetail>(`${TCGDEX}/en/sets/${setId}`).catch(() => null);
      if (detail) overrideBriefs.push({ id: detail.id, name: detail.name, cardCount: detail.cardCount });
    }
  }
  for (const s of overrideBriefs) {
    const eraId = PROMO_OVERRIDES[s.id];
    if (!eraId) continue;
    promoSetsByEra[eraId].push(s.id);
    setEra[s.id] = eraId;
    allSets.push(s);
  }

  const totalSets = allSets.length;
  console.log(`Collected ${totalSets} sets across ${eras.length} eras.`);

  // 2. Fetch set details (release dates + which cards lack images)
  console.log("Fetching set details (release dates, image coverage)...");
  const details = await mapConcurrent(allSets, 10, (s) =>
    getJson<TCGDexSetDetail>(`${TCGDEX}/en/sets/${encodeURIComponent(s.id)}`).catch(() => null)
  );
  const detailById: Record<string, TCGDexSetDetail> = {};
  for (const d of details) if (d) detailById[d.id] = d;

  const setsMissingImages = Object.values(detailById).filter(
    (d) => (d.cards || []).some((c) => !c.image)
  );
  console.log(`${setsMissingImages.length} sets contain cards with no TCGdex image.`);

  // 3. Match to pokemontcg.io sets for the image fallback
  console.log("Fetching pokemontcg.io sets...");
  let apiKey = "";
  try {
    const env = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
    apiKey = env.match(/^POKEMON_TCG_API_KEY=(.*)$/m)?.[1]?.trim() ?? "";
  } catch {
    /* no .env.local — proceed unauthenticated (rate-limited) */
  }
  const ptcgioHeaders: Record<string, string> = apiKey ? { "X-Api-Key": apiKey } : {};
  const ptcgioSets: PtcgioSet[] = [];
  for (let page = 1; ; page++) {
    const res = await getJson<{ data: PtcgioSet[]; totalCount: number }>(
      `https://api.pokemontcg.io/v2/sets?pageSize=250&page=${page}`,
      ptcgioHeaders
    );
    ptcgioSets.push(...res.data);
    if (ptcgioSets.length >= res.totalCount) break;
  }
  console.log(`pokemontcg.io has ${ptcgioSets.length} sets.`);

  // Promo sets may only match promo sets (and vice versa) — otherwise e.g.
  // "SVP Black Star Promos" date+count-matches the SV base set and the
  // fallback would serve the wrong card's image.
  const ptcgioSetMap: Record<string, string> = { ...MANUAL_PTCGIO_MAP };
  const claimed = new Set<string>(Object.values(MANUAL_PTCGIO_MAP));
  const isPromoName = (n: string) => PROMO_NAME_RE.test(n);
  const candidates = (d: TCGDexSetDetail) =>
    ptcgioSets.filter(
      (p) => isPromoName(p.name) === isPromoName(d.name) && !claimed.has(p.id)
    );
  const dayDiff = (d: TCGDexSetDetail, p: PtcgioSet) =>
    Math.abs(Date.parse(p.releaseDate.replace(/\//g, "-")) - Date.parse(d.releaseDate!)) / 86400000;

  // Pass 1: exact normalized-name matches within a release window
  for (const d of Object.values(detailById)) {
    if (d.id in ptcgioSetMap || !d.releaseDate) continue;
    const dName = normName(d.name);
    const hit = candidates(d).find((p) => normName(p.name) === dName && dayDiff(d, p) <= 60);
    if (hit) {
      ptcgioSetMap[d.id] = hit.id;
      claimed.add(hit.id);
    }
  }
  // Pass 2: date + card count for the rest (unclaimed candidates only)
  for (const d of Object.values(detailById)) {
    if (d.id in ptcgioSetMap || !d.releaseDate) continue;
    const dTotal = d.cardCount?.total ?? 0;
    if (dTotal === 0) continue;
    let best: { id: string; score: number } | null = null;
    for (const p of candidates(d)) {
      const days = dayDiff(d, p);
      if (days > 21) continue;
      if (Math.abs(p.total - dTotal) / dTotal >= 0.25) continue;
      const score = (days < 2 ? 1 : 0) + (p.total === dTotal ? 1 : 0);
      if (!best || score > best.score) best = { id: p.id, score };
    }
    if (best) {
      ptcgioSetMap[d.id] = best.id;
      claimed.add(best.id);
    }
  }
  console.log(`Matched ${Object.keys(ptcgioSetMap).length}/${totalSets} sets to pokemontcg.io.`);

  // 4. Verify the fallback actually serves images for the sets that need it
  console.log("Verifying fallback images for sets with missing TCGdex scans...");
  for (const d of setsMissingImages) {
    const pid = ptcgioSetMap[d.id];
    if (!pid) {
      console.log(`  ${d.id} (${d.name}): no pokemontcg.io match — cards stay imageless`);
      continue;
    }
    const sample = (d.cards || []).find((c) => !c.image);
    if (!sample) continue;
    const num = String(sample.localId).replace(/^0+(?=\d)/, "");
    const url = `https://images.pokemontcg.io/${pid}/${num}.png`;
    const ok = (await fetch(url, { method: "HEAD" })).ok;
    console.log(`  ${d.id} -> ${pid}: sample ${num}.png ${ok ? "OK" : "MISSING"}`);
    if (!ok) delete ptcgioSetMap[d.id];
  }

  // 5. Write output
  const out = {
    generatedAt: new Date().toISOString(),
    eras,
    promoSetsByEra,
    ptcgioSetMap,
  };
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${OUT_PATH}`);
  console.log("Eras:", eras.map((e) => `${e.en} (${e.sets.length} sets)`).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
