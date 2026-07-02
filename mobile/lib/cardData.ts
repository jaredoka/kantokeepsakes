// COPY of src/lib/marketplace/cardData.ts (the mobile app cannot import from src/ — no
// workspace, per D10). After running 'npm run update-cards' on the website, re-copy
// this file and cardData.generated.json into mobile/lib/.
import generated from "./cardData.generated.json";

// ── CardItem shape (emitted by CardPicker, stored in form state) ─────────────
export interface CardItem {
  localId: string; // e.g. "4", "SV001"
  name: string; // e.g. "Charizard"
  img: string; // full image URL
  set: string; // set ID, e.g. "sv3pt5"
  lang: "en" | "ja";
}

// ── Era / Set taxonomy ──────────────────────────────────────────────────────
// Generated from the TCGdex API by `npx tsx scripts/update-card-data.ts`.
// Re-run that script whenever a new set or era releases, then update
// JA_SET_MAP below for any new sets that have Japanese equivalents.

export interface EraSet {
  id: string;
  en: string;
}

export interface Era {
  id: string;
  en: string;
  sets: EraSet[];
}

export const ERA_DATA: Era[] = generated.eras;

// TCGdex set ID → pokemontcg.io set ID. Image fallback for English cards
// TCGdex has no scan of: images.pokemontcg.io/{ptcgioSetId}/{number}.png
export const PTCGIO_SET_MAP: Record<string, string> =
  generated.ptcgioSetMap as Record<string, string>;

// ── EN set → Japanese TCGdex set ID(s) ──────────────────────────────────────
// TCGdex uses entirely different set IDs for Japanese releases (e.g. Pokémon
// 151 is `sv03.5` in EN but `SV2a` in JA). One EN set often bundles several
// JA sets. Sets absent from this map have no Japanese data on TCGdex
// (all of Black & White / Diamond & Pearl, plus a few EN-exclusive sets).
export const JA_SET_MAP: Record<string, string[]> = {
  // Mega Evolution (JP sets release ~2 months before EN; matched by date+size)
  "me01": ["M1L", "M1S"],
  "me02": ["M2"],
  "me03": ["M3"],
  // Scarlet & Violet
  "sv01": ["SV1S", "SV1V"],
  "sv02": ["SV2D", "SV2P", "SV1a"],
  "sv03": ["SV3"],
  "sv03.5": ["SV2a"],
  "sv04": ["SV4K", "SV4M", "SV3a"],
  "sv04.5": ["SV4a"],
  "sv05": ["SV5K", "SV5M"],
  "sv06": ["SV6", "SV5a"],
  "sv06.5": ["SV6a"],
  "sv07": ["SV7"],
  "sv08": ["SV8", "SV7a"],
  "sv08.5": ["SV8a"],
  "sv09": ["SV9"],
  "sv10": ["SV10", "SV9a"],
  "sv10.5b": ["SV11B"],
  "sv10.5w": ["SV11W"],
  // Sword & Shield
  "swsh1": ["S1W", "S1H", "S1a"],
  "swsh2": ["S2"],
  "swsh3": ["S3", "S2a"],
  "swsh4": ["S4", "S3a"],
  "swsh4.5": ["S4a"],
  "swsh5": ["S5I", "S5R"],
  "swsh6": ["S6H", "S6K", "S5a"],
  "swsh7": ["S6a", "S7R", "S7D"],
  "cel25": ["S8a"],
  "swsh8": ["S8"],
  "swsh9": ["S9", "S8b"],
  "swsh10": ["S10D", "S10P"],
  "swsh10.5": ["S10b"],
  "swsh11": ["S11", "S10a"],
  "swsh12": ["S12", "S11a"],
  "swsh12.5": ["S12a"],
  // Sun & Moon
  "sm1": ["SM1S", "SM1M", "SM1+"],
  "sm2": ["SM2L", "SM2K", "sm2+"],
  "sm3": ["SM3N", "SM3H"],
  "sm3.5": ["SM3+"],
  "sm4": ["SM4S", "SM4A", "SM4+"],
  "sm5": ["SM5S", "SM5M", "SM5+"],
  "sm6": ["SM6"],
  "sm7": ["SM7", "SM6b"],
  "sm7.5": ["SM6a"],
  "sm8": ["SM8", "SM7a", "SM7b"],
  "sm9": ["SM9", "SM8a"],
  "sm10": ["SM10", "SM9a", "SM9b"],
  "sm11": ["sn11", "SM10b", "sn10a"],
  "sm115": ["SM8b"],
  "sm12": ["SM12", "SM11a", "SM11b"],
  "det1": ["SMP2"],
  // XY
  "xy1": ["XY1a", "XY1b"],
  "xy2": ["XY2"],
  "xy3": ["XY3"],
  "xy4": ["XY4"],
  "xy5": ["XY5a"],
  "xy6": ["XY6"],
  "xy7": ["XY7"],
  "xy8": ["XY8a", "XY8b"],
  "xy9": ["XY9"],
  "g1": ["CP3", "CP4"],
  "xy10": ["XY10"],
  "xy11": ["XY11a"],
  "xy12": ["CP6"],
  // HeartGold & SoulSilver
  "hgss1": ["L1a", "L1b"],
  "hgss2": ["L2"],
  "hgss3": ["LL"],
  "hgss4": ["L3"],
  // EX Series
  "ex1": ["ADV1"],
  "ex2": ["ADV2"],
  "ex3": ["ADV3"],
  "ex4": ["ADV4"],
  "ex5": ["ADV5"],
  "ex6": ["PCG1"],
  "ex7": ["PCG3"],
  "ex8": ["PCG2"],
  "ex10": ["PCG4"],
  "ex11": ["PCG6"],
  "ex12": ["PCG5"],
  "ex13": ["PCG7"],
  "ex14": ["PCG8"],
  "ex15": ["PCG9"],
  // Neo / e-Card
  "neo1": ["neo1"],
  "neo2": ["neo2"],
  "neo3": ["neo3"],
  "neo4": ["neo4"],
  "ecard1": ["E1"],
  "ecard2": ["E2", "E3"],
  "ecard3": ["E4", "E5"],
  // Original (Wizards) — TCGdex EN ids: base2=Jungle, base3=Fossil,
  // base4=Base Set 2, base5=Team Rocket
  "base1": ["PMCG1"],
  "base2": ["PMCG2"],
  "base3": ["PMCG3"],
  "base5": ["PMCG4"],
  "gym1": ["PMCG5"],
  "gym2": ["PMCG6"],
};

// ── Promo sets per era (English TCGdex set IDs) ─────────────────────────────
// Generated alongside ERA_DATA. TCGdex has no standalone Japanese promo sets,
// so these are EN-only.
export const PROMO_SETS_BY_ERA: Record<string, string[]> =
  generated.promoSetsByEra as Record<string, string[]>;

export const ALL_PROMO_SET_IDS: Set<string> = new Set(
  Object.values(PROMO_SETS_BY_ERA).flat()
);

// ── Set ordering for multi-set search results ───────────────────────────────
// Rank = eraIndex * 1000 + setIndex, so results sort newest era first,
// following ERA_DATA order. Promo sets rank after their era's regular sets.
// JA set IDs inherit the rank of their EN parent set.
export const SET_RANK: Record<string, number> = (() => {
  const rank: Record<string, number> = {};
  ERA_DATA.forEach((eraObj, e) => {
    eraObj.sets.forEach((s, i) => {
      const r = e * 1000 + i;
      if (!(s.id in rank)) rank[s.id] = r;
      for (const jaId of JA_SET_MAP[s.id] ?? []) {
        if (!(jaId in rank)) rank[jaId] = r;
      }
    });
    for (const promoId of PROMO_SETS_BY_ERA[eraObj.id] ?? []) {
      if (!(promoId in rank)) rank[promoId] = e * 1000 + 900;
    }
  });
  return rank;
})();

// ── Bidirectional EN ↔ JA Translation Map ───────────────────────────────────
const TRANSLATION_MAP: Record<string, string> = {
  // Pokemon names
  charizard: "リザードン", "リザードン": "charizard",
  pikachu: "ピカチュウ", "ピカチュウ": "pikachu",
  mewtwo: "ミュウツー", "ミュウツー": "mewtwo",
  mew: "ミュウ", "ミュウ": "mew",
  blastoise: "カメックス", "カメックス": "blastoise",
  venusaur: "フシギバナ", "フシギバナ": "venusaur",
  bulbasaur: "フシギダネ", "フシギダネ": "bulbasaur",
  squirtle: "ゼニガメ", "ゼニガメ": "squirtle",
  charmander: "ヒトカゲ", "ヒトカゲ": "charmander",
  raichu: "ライチュウ", "ライチュウ": "raichu",
  eevee: "イーブイ", "イーブイ": "eevee",
  umbreon: "ブラッキー", "ブラッキー": "umbreon",
  espeon: "エーフィ", "エーフィ": "espeon",
  sylveon: "ニンフィア", "ニンフィア": "sylveon",
  vaporeon: "シャワーズ", "シャワーズ": "vaporeon",
  jolteon: "サンダース", "サンダース": "jolteon",
  flareon: "ブースター", "ブースター": "flareon",
  leafeon: "リーフィア", "リーフィア": "leafeon",
  glaceon: "グレイシア", "グレイシア": "glaceon",
  gengar: "ゲンガー", "ゲンガー": "gengar",
  lugia: "ルギア", "ルギア": "lugia",
  "ho-oh": "ホウオウ", "ホウオウ": "ho-oh",
  rayquaza: "レックウザ", "レックウザ": "rayquaza",
  celebi: "セレビィ", "セレビィ": "celebi",
  gyarados: "ギャラドス", "ギャラドス": "gyarados",
  snorlax: "カビゴン", "カビゴン": "snorlax",
  dragonite: "カイリュー", "カイリュー": "dragonite",
  lapras: "ラプラス", "ラプラス": "lapras",
  garchomp: "ガブリアス", "ガブリアス": "garchomp",
  lucario: "ルカリオ", "ルカリオ": "lucario",
  zacian: "ザシアン", "ザシアン": "zacian",
  zamazenta: "ザマゼンタ", "ザマゼンタ": "zamazenta",
  miraidon: "ミライドン", "ミライドン": "miraidon",
  koraidon: "コライドン", "コライドン": "koraidon",
  // Set / product names
  "eevee heroes": "イーブイヒーローズ", "イーブイヒーローズ": "eevee heroes evolving skies",
  "shiny treasure": "シャイニートレジャー", "シャイニートレジャー": "shiny treasure paldean fates",
  "lost abyss": "ロストアビス", "ロストアビス": "lost abyss lost origin",
  "star birth": "スターバース", "スターバース": "star birth brilliant stars",
  "vstar universe": "VSTARユニバース", "VSTARユニバース": "vstar universe crown zenith",
  "fusion arts": "フュージョンアーツ", "フュージョンアーツ": "fusion arts fusion strike",
  "time gazer": "タイムゲイザー", "タイムゲイザー": "time gazer astral radiance",
  "double blaze": "ダブルブレイズ", "ダブルブレイズ": "double blaze unbroken bonds",
  "alter genesis": "オルタージェネシス", "オルタージェネシス": "alter genesis unified minds",
  "tag bolt": "タッグボルト", "タッグボルト": "tag bolt team up",
  "raging surf": "レイジングサーフ", "レイジングサーフ": "raging surf obsidian flames",
  "clay burst": "クレイバースト", "クレイバースト": "clay burst paldea evolved",
  "stellar miracle": "ステラミラクル", "ステラミラクル": "stellar miracle stellar crown",
  "ancient roar": "エイシャントロアー", "エイシャントロアー": "ancient roar paradox rift",
  "future flash": "フューチャーフラッシュ", "フューチャーフラッシュ": "future flash paradox rift",
  "mask of change": "マスクオブチェンジ", "マスクオブチェンジ": "mask of change twilight masquerade",
  "battle partners": "バトルパートナーズ", "バトルパートナーズ": "battle partners destined rivals",
  "terastal fest": "テラスタルフェスex", "テラスタルフェスex": "terastal fest prismatic evolutions",
  "151": "ポケモンカード151", "ポケモンカード151": "151 pokemon 151",
  "lost thunder": "ロストサンダー", "ロストサンダー": "lost thunder",
  // Card terms
  promo: "プロモ", "プロモ": "promo",
  graded: "グレード", "グレード": "graded",
  sealed: "シールド", "シールド": "sealed",
  booster: "パック", "パック": "booster pack",
  japanese: "日本語", "日本語": "japanese",
  english: "英語", "英語": "english",
};

/** Expand a search query with cross-language translations */
export function expandQuery(q: string): string[] {
  if (!q || !q.trim()) return [];
  const lower = q.toLowerCase().trim();
  const terms = new Set([lower]);
  for (const [key, val] of Object.entries(TRANSLATION_MAP)) {
    if (lower.includes(key.toLowerCase())) {
      const vals = Array.isArray(val) ? val : [val];
      for (const v of vals) terms.add(v.toLowerCase());
    }
  }
  return Array.from(terms);
}

// ── Country list (195 entries) ──────────────────────────────────────────────
export interface Country {
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: "Afghanistan", flag: "\u{1F1E6}\u{1F1EB}" }, { name: "Albania", flag: "\u{1F1E6}\u{1F1F1}" },
  { name: "Algeria", flag: "\u{1F1E9}\u{1F1FF}" }, { name: "Andorra", flag: "\u{1F1E6}\u{1F1E9}" },
  { name: "Angola", flag: "\u{1F1E6}\u{1F1F4}" }, { name: "Antigua & Barbuda", flag: "\u{1F1E6}\u{1F1EC}" },
  { name: "Argentina", flag: "\u{1F1E6}\u{1F1F7}" }, { name: "Armenia", flag: "\u{1F1E6}\u{1F1F2}" },
  { name: "Australia", flag: "\u{1F1E6}\u{1F1FA}" }, { name: "Austria", flag: "\u{1F1E6}\u{1F1F9}" },
  { name: "Azerbaijan", flag: "\u{1F1E6}\u{1F1FF}" }, { name: "Bahamas", flag: "\u{1F1E7}\u{1F1F8}" },
  { name: "Bahrain", flag: "\u{1F1E7}\u{1F1ED}" }, { name: "Bangladesh", flag: "\u{1F1E7}\u{1F1E9}" },
  { name: "Barbados", flag: "\u{1F1E7}\u{1F1E7}" }, { name: "Belarus", flag: "\u{1F1E7}\u{1F1FE}" },
  { name: "Belgium", flag: "\u{1F1E7}\u{1F1EA}" }, { name: "Belize", flag: "\u{1F1E7}\u{1F1FF}" },
  { name: "Benin", flag: "\u{1F1E7}\u{1F1EF}" }, { name: "Bhutan", flag: "\u{1F1E7}\u{1F1F9}" },
  { name: "Bolivia", flag: "\u{1F1E7}\u{1F1F4}" }, { name: "Bosnia & Herzegovina", flag: "\u{1F1E7}\u{1F1E6}" },
  { name: "Botswana", flag: "\u{1F1E7}\u{1F1FC}" }, { name: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  { name: "Brunei", flag: "\u{1F1E7}\u{1F1F3}" }, { name: "Bulgaria", flag: "\u{1F1E7}\u{1F1EC}" },
  { name: "Burkina Faso", flag: "\u{1F1E7}\u{1F1EB}" }, { name: "Burundi", flag: "\u{1F1E7}\u{1F1EE}" },
  { name: "Cambodia", flag: "\u{1F1F0}\u{1F1ED}" }, { name: "Cameroon", flag: "\u{1F1E8}\u{1F1F2}" },
  { name: "Canada", flag: "\u{1F1E8}\u{1F1E6}" }, { name: "Cape Verde", flag: "\u{1F1E8}\u{1F1FB}" },
  { name: "Central African Republic", flag: "\u{1F1E8}\u{1F1EB}" }, { name: "Chad", flag: "\u{1F1F9}\u{1F1E9}" },
  { name: "Chile", flag: "\u{1F1E8}\u{1F1F1}" }, { name: "China", flag: "\u{1F1E8}\u{1F1F3}" },
  { name: "Colombia", flag: "\u{1F1E8}\u{1F1F4}" }, { name: "Comoros", flag: "\u{1F1F0}\u{1F1F2}" },
  { name: "Congo", flag: "\u{1F1E8}\u{1F1EC}" }, { name: "Costa Rica", flag: "\u{1F1E8}\u{1F1F7}" },
  { name: "Croatia", flag: "\u{1F1ED}\u{1F1F7}" }, { name: "Cuba", flag: "\u{1F1E8}\u{1F1FA}" },
  { name: "Cyprus", flag: "\u{1F1E8}\u{1F1FE}" }, { name: "Czech Republic", flag: "\u{1F1E8}\u{1F1FF}" },
  { name: "Denmark", flag: "\u{1F1E9}\u{1F1F0}" }, { name: "Djibouti", flag: "\u{1F1E9}\u{1F1EF}" },
  { name: "Dominica", flag: "\u{1F1E9}\u{1F1F2}" }, { name: "Dominican Republic", flag: "\u{1F1E9}\u{1F1F4}" },
  { name: "Ecuador", flag: "\u{1F1EA}\u{1F1E8}" }, { name: "Egypt", flag: "\u{1F1EA}\u{1F1EC}" },
  { name: "El Salvador", flag: "\u{1F1F8}\u{1F1FB}" }, { name: "Equatorial Guinea", flag: "\u{1F1EC}\u{1F1F6}" },
  { name: "Eritrea", flag: "\u{1F1EA}\u{1F1F7}" }, { name: "Estonia", flag: "\u{1F1EA}\u{1F1EA}" },
  { name: "Eswatini", flag: "\u{1F1F8}\u{1F1FF}" }, { name: "Ethiopia", flag: "\u{1F1EA}\u{1F1F9}" },
  { name: "Fiji", flag: "\u{1F1EB}\u{1F1EF}" }, { name: "Finland", flag: "\u{1F1EB}\u{1F1EE}" },
  { name: "France", flag: "\u{1F1EB}\u{1F1F7}" }, { name: "Gabon", flag: "\u{1F1EC}\u{1F1E6}" },
  { name: "Gambia", flag: "\u{1F1EC}\u{1F1F2}" }, { name: "Georgia", flag: "\u{1F1EC}\u{1F1EA}" },
  { name: "Germany", flag: "\u{1F1E9}\u{1F1EA}" }, { name: "Ghana", flag: "\u{1F1EC}\u{1F1ED}" },
  { name: "Greece", flag: "\u{1F1EC}\u{1F1F7}" }, { name: "Grenada", flag: "\u{1F1EC}\u{1F1E9}" },
  { name: "Guatemala", flag: "\u{1F1EC}\u{1F1F9}" }, { name: "Guinea", flag: "\u{1F1EC}\u{1F1F3}" },
  { name: "Guinea-Bissau", flag: "\u{1F1EC}\u{1F1FC}" }, { name: "Guyana", flag: "\u{1F1EC}\u{1F1FE}" },
  { name: "Haiti", flag: "\u{1F1ED}\u{1F1F9}" }, { name: "Honduras", flag: "\u{1F1ED}\u{1F1F3}" },
  { name: "Hong Kong", flag: "\u{1F1ED}\u{1F1F0}" }, { name: "Hungary", flag: "\u{1F1ED}\u{1F1FA}" },
  { name: "Iceland", flag: "\u{1F1EE}\u{1F1F8}" }, { name: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { name: "Indonesia", flag: "\u{1F1EE}\u{1F1E9}" }, { name: "Iran", flag: "\u{1F1EE}\u{1F1F7}" },
  { name: "Iraq", flag: "\u{1F1EE}\u{1F1F6}" }, { name: "Ireland", flag: "\u{1F1EE}\u{1F1EA}" },
  { name: "Israel", flag: "\u{1F1EE}\u{1F1F1}" }, { name: "Italy", flag: "\u{1F1EE}\u{1F1F9}" },
  { name: "Jamaica", flag: "\u{1F1EF}\u{1F1F2}" }, { name: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  { name: "Jordan", flag: "\u{1F1EF}\u{1F1F4}" }, { name: "Kazakhstan", flag: "\u{1F1F0}\u{1F1FF}" },
  { name: "Kenya", flag: "\u{1F1F0}\u{1F1EA}" }, { name: "Kiribati", flag: "\u{1F1F0}\u{1F1EE}" },
  { name: "Kuwait", flag: "\u{1F1F0}\u{1F1FC}" }, { name: "Kyrgyzstan", flag: "\u{1F1F0}\u{1F1EC}" },
  { name: "Laos", flag: "\u{1F1F1}\u{1F1E6}" }, { name: "Latvia", flag: "\u{1F1F1}\u{1F1FB}" },
  { name: "Lebanon", flag: "\u{1F1F1}\u{1F1E7}" }, { name: "Lesotho", flag: "\u{1F1F1}\u{1F1F8}" },
  { name: "Liberia", flag: "\u{1F1F1}\u{1F1F7}" }, { name: "Libya", flag: "\u{1F1F1}\u{1F1FE}" },
  { name: "Liechtenstein", flag: "\u{1F1F1}\u{1F1EE}" }, { name: "Lithuania", flag: "\u{1F1F1}\u{1F1F9}" },
  { name: "Luxembourg", flag: "\u{1F1F1}\u{1F1FA}" }, { name: "Madagascar", flag: "\u{1F1F2}\u{1F1EC}" },
  { name: "Malawi", flag: "\u{1F1F2}\u{1F1FC}" }, { name: "Malaysia", flag: "\u{1F1F2}\u{1F1FE}" },
  { name: "Maldives", flag: "\u{1F1F2}\u{1F1FB}" }, { name: "Mali", flag: "\u{1F1F2}\u{1F1F1}" },
  { name: "Malta", flag: "\u{1F1F2}\u{1F1F9}" }, { name: "Marshall Islands", flag: "\u{1F1F2}\u{1F1ED}" },
  { name: "Mauritania", flag: "\u{1F1F2}\u{1F1F7}" }, { name: "Mauritius", flag: "\u{1F1F2}\u{1F1FA}" },
  { name: "Mexico", flag: "\u{1F1F2}\u{1F1FD}" }, { name: "Micronesia", flag: "\u{1F1EB}\u{1F1F2}" },
  { name: "Moldova", flag: "\u{1F1F2}\u{1F1E9}" }, { name: "Monaco", flag: "\u{1F1F2}\u{1F1E8}" },
  { name: "Mongolia", flag: "\u{1F1F2}\u{1F1F3}" }, { name: "Montenegro", flag: "\u{1F1F2}\u{1F1EA}" },
  { name: "Morocco", flag: "\u{1F1F2}\u{1F1E6}" }, { name: "Mozambique", flag: "\u{1F1F2}\u{1F1FF}" },
  { name: "Myanmar", flag: "\u{1F1F2}\u{1F1F2}" }, { name: "Namibia", flag: "\u{1F1F3}\u{1F1E6}" },
  { name: "Nauru", flag: "\u{1F1F3}\u{1F1F7}" }, { name: "Nepal", flag: "\u{1F1F3}\u{1F1F5}" },
  { name: "Netherlands", flag: "\u{1F1F3}\u{1F1F1}" }, { name: "New Zealand", flag: "\u{1F1F3}\u{1F1FF}" },
  { name: "Nicaragua", flag: "\u{1F1F3}\u{1F1EE}" }, { name: "Niger", flag: "\u{1F1F3}\u{1F1EA}" },
  { name: "Nigeria", flag: "\u{1F1F3}\u{1F1EC}" }, { name: "North Korea", flag: "\u{1F1F0}\u{1F1F5}" },
  { name: "North Macedonia", flag: "\u{1F1F2}\u{1F1F0}" }, { name: "Norway", flag: "\u{1F1F3}\u{1F1F4}" },
  { name: "Oman", flag: "\u{1F1F4}\u{1F1F2}" }, { name: "Pakistan", flag: "\u{1F1F5}\u{1F1F0}" },
  { name: "Palau", flag: "\u{1F1F5}\u{1F1FC}" }, { name: "Panama", flag: "\u{1F1F5}\u{1F1E6}" },
  { name: "Papua New Guinea", flag: "\u{1F1F5}\u{1F1EC}" }, { name: "Paraguay", flag: "\u{1F1F5}\u{1F1FE}" },
  { name: "Peru", flag: "\u{1F1F5}\u{1F1EA}" }, { name: "Philippines", flag: "\u{1F1F5}\u{1F1ED}" },
  { name: "Poland", flag: "\u{1F1F5}\u{1F1F1}" }, { name: "Portugal", flag: "\u{1F1F5}\u{1F1F9}" },
  { name: "Qatar", flag: "\u{1F1F6}\u{1F1E6}" }, { name: "Romania", flag: "\u{1F1F7}\u{1F1F4}" },
  { name: "Russia", flag: "\u{1F1F7}\u{1F1FA}" }, { name: "Rwanda", flag: "\u{1F1F7}\u{1F1FC}" },
  { name: "Saint Kitts & Nevis", flag: "\u{1F1F0}\u{1F1F3}" }, { name: "Saint Lucia", flag: "\u{1F1F1}\u{1F1E8}" },
  { name: "Saint Vincent", flag: "\u{1F1FB}\u{1F1E8}" }, { name: "Samoa", flag: "\u{1F1FC}\u{1F1F8}" },
  { name: "San Marino", flag: "\u{1F1F8}\u{1F1F2}" }, { name: "Saudi Arabia", flag: "\u{1F1F8}\u{1F1E6}" },
  { name: "Senegal", flag: "\u{1F1F8}\u{1F1F3}" }, { name: "Serbia", flag: "\u{1F1F7}\u{1F1F8}" },
  { name: "Seychelles", flag: "\u{1F1F8}\u{1F1E8}" }, { name: "Sierra Leone", flag: "\u{1F1F8}\u{1F1F1}" },
  { name: "Singapore", flag: "\u{1F1F8}\u{1F1EC}" }, { name: "Slovakia", flag: "\u{1F1F8}\u{1F1F0}" },
  { name: "Slovenia", flag: "\u{1F1F8}\u{1F1EE}" }, { name: "Solomon Islands", flag: "\u{1F1F8}\u{1F1E7}" },
  { name: "Somalia", flag: "\u{1F1F8}\u{1F1F4}" }, { name: "South Africa", flag: "\u{1F1FF}\u{1F1E6}" },
  { name: "South Korea", flag: "\u{1F1F0}\u{1F1F7}" }, { name: "South Sudan", flag: "\u{1F1F8}\u{1F1F8}" },
  { name: "Spain", flag: "\u{1F1EA}\u{1F1F8}" }, { name: "Sri Lanka", flag: "\u{1F1F1}\u{1F1F0}" },
  { name: "Sudan", flag: "\u{1F1F8}\u{1F1E9}" }, { name: "Suriname", flag: "\u{1F1F8}\u{1F1F7}" },
  { name: "Sweden", flag: "\u{1F1F8}\u{1F1EA}" }, { name: "Switzerland", flag: "\u{1F1E8}\u{1F1ED}" },
  { name: "Syria", flag: "\u{1F1F8}\u{1F1FE}" }, { name: "Taiwan", flag: "\u{1F1F9}\u{1F1FC}" },
  { name: "Tajikistan", flag: "\u{1F1F9}\u{1F1EF}" }, { name: "Tanzania", flag: "\u{1F1F9}\u{1F1FF}" },
  { name: "Thailand", flag: "\u{1F1F9}\u{1F1ED}" }, { name: "Timor-Leste", flag: "\u{1F1F9}\u{1F1F1}" },
  { name: "Togo", flag: "\u{1F1F9}\u{1F1EC}" }, { name: "Tonga", flag: "\u{1F1F9}\u{1F1F4}" },
  { name: "Trinidad & Tobago", flag: "\u{1F1F9}\u{1F1F9}" }, { name: "Tunisia", flag: "\u{1F1F9}\u{1F1F3}" },
  { name: "Turkey", flag: "\u{1F1F9}\u{1F1F7}" }, { name: "Turkmenistan", flag: "\u{1F1F9}\u{1F1F2}" },
  { name: "Tuvalu", flag: "\u{1F1F9}\u{1F1FB}" }, { name: "Uganda", flag: "\u{1F1FA}\u{1F1EC}" },
  { name: "Ukraine", flag: "\u{1F1FA}\u{1F1E6}" }, { name: "United Arab Emirates", flag: "\u{1F1E6}\u{1F1EA}" },
  { name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" }, { name: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { name: "Uruguay", flag: "\u{1F1FA}\u{1F1FE}" }, { name: "Uzbekistan", flag: "\u{1F1FA}\u{1F1FF}" },
  { name: "Vanuatu", flag: "\u{1F1FB}\u{1F1FA}" }, { name: "Vatican City", flag: "\u{1F1FB}\u{1F1E6}" },
  { name: "Venezuela", flag: "\u{1F1FB}\u{1F1EA}" }, { name: "Vietnam", flag: "\u{1F1FB}\u{1F1F3}" },
  { name: "Yemen", flag: "\u{1F1FE}\u{1F1EA}" }, { name: "Zambia", flag: "\u{1F1FF}\u{1F1F2}" },
  { name: "Zimbabwe", flag: "\u{1F1FF}\u{1F1FC}" },
];

// ── States / Provinces by country (optional dropdown) ─────────────────────────
// Only countries with well-known subdivisions are included.
// Keys must match the `name` field in the COUNTRIES array above.

export const STATES_BY_COUNTRY: Record<string, string[]> = {
  "Australia": [
    "Australian Capital Territory", "New South Wales", "Northern Territory",
    "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia",
  ],
  "Brazil": [
    "Acre", "Alagoas", "Amapa", "Amazonas", "Bahia", "Ceara",
    "Distrito Federal", "Espirito Santo", "Goias", "Maranhao",
    "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Para",
    "Paraiba", "Parana", "Pernambuco", "Piaui", "Rio de Janeiro",
    "Rio Grande do Norte", "Rio Grande do Sul", "Rondonia", "Roraima",
    "Santa Catarina", "Sao Paulo", "Sergipe", "Tocantins",
  ],
  "Brunei": [
    "Belait", "Brunei-Muara", "Temburong", "Tutong",
  ],
  "Canada": [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick",
    "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia",
    "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan",
    "Yukon",
  ],
  "China": [
    "Anhui", "Beijing", "Chongqing", "Fujian", "Gansu", "Guangdong",
    "Guangxi", "Guizhou", "Hainan", "Hebei", "Heilongjiang", "Henan",
    "Hong Kong", "Hubei", "Hunan", "Inner Mongolia", "Jiangsu", "Jiangxi",
    "Jilin", "Liaoning", "Macau", "Ningxia", "Qinghai", "Shaanxi",
    "Shandong", "Shanghai", "Shanxi", "Sichuan", "Tianjin", "Tibet",
    "Xinjiang", "Yunnan", "Zhejiang",
  ],
  "Germany": [
    "Baden-Wurttemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen",
    "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern",
    "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland",
    "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia",
  ],
  "India": [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
    "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
  ],
  "Indonesia": [
    "Aceh", "Bali", "Banten", "Bengkulu", "Central Java",
    "Central Kalimantan", "Central Sulawesi", "East Java",
    "East Kalimantan", "East Nusa Tenggara", "Gorontalo", "Jakarta",
    "Jambi", "Lampung", "Maluku", "North Kalimantan", "North Maluku",
    "North Sulawesi", "North Sumatra", "Papua", "Riau",
    "South Kalimantan", "South Sulawesi", "South Sumatra",
    "Southeast Sulawesi", "West Java", "West Kalimantan",
    "West Nusa Tenggara", "West Papua", "West Sulawesi",
    "West Sumatra", "Yogyakarta",
  ],
  "Japan": [
    "Hokkaido", "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata",
    "Fukushima", "Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba",
    "Tokyo", "Kanagawa", "Niigata", "Toyama", "Ishikawa", "Fukui",
    "Yamanashi", "Nagano", "Gifu", "Shizuoka", "Aichi", "Mie",
    "Shiga", "Kyoto", "Osaka", "Hyogo", "Nara", "Wakayama",
    "Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi",
    "Tokushima", "Kagawa", "Ehime", "Kochi", "Fukuoka", "Saga",
    "Nagasaki", "Kumamoto", "Oita", "Miyazaki", "Kagoshima", "Okinawa",
  ],
  "Malaysia": [
    "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka",
    "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Putrajaya",
    "Sabah", "Sarawak", "Selangor", "Terengganu",
  ],
  "Mexico": [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
    "Chiapas", "Chihuahua", "Ciudad de Mexico", "Coahuila", "Colima",
    "Durango", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco",
    "Mexico State", "Michoacan", "Morelos", "Nayarit", "Nuevo Leon",
    "Oaxaca", "Puebla", "Queretaro", "Quintana Roo", "San Luis Potosi",
    "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala",
    "Veracruz", "Yucatan", "Zacatecas",
  ],
  "Philippines": [
    "Metro Manila", "Cebu", "Davao del Sur", "Pampanga", "Bulacan",
    "Cavite", "Laguna", "Batangas", "Rizal", "Quezon", "Pangasinan",
    "Iloilo", "Negros Occidental", "Zamboanga del Sur", "Leyte",
  ],
  "South Korea": [
    "Busan", "Chungcheongbuk-do", "Chungcheongnam-do", "Daegu", "Daejeon",
    "Gangwon-do", "Gwangju", "Gyeonggi-do", "Gyeongsangbuk-do",
    "Gyeongsangnam-do", "Incheon", "Jeju", "Jeollabuk-do",
    "Jeollanam-do", "Sejong", "Seoul", "Ulsan",
  ],
  "Taiwan": [
    "Changhua", "Chiayi", "Hsinchu", "Hualien", "Kaohsiung",
    "Keelung", "Kinmen", "Lienchiang", "Miaoli", "Nantou",
    "New Taipei", "Penghu", "Pingtung", "Taichung", "Tainan",
    "Taipei", "Taitung", "Taoyuan", "Yilan", "Yunlin",
  ],
  "Thailand": [
    "Bangkok", "Chiang Mai", "Chiang Rai", "Chonburi", "Khon Kaen",
    "Krabi", "Nakhon Ratchasima", "Nonthaburi", "Pathum Thani",
    "Phuket", "Samut Prakan", "Songkhla", "Surat Thani", "Udon Thani",
  ],
  "United Kingdom": [
    "England", "Northern Ireland", "Scotland", "Wales",
  ],
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York",
    "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
    "West Virginia", "Wisconsin", "Wyoming",
  ],
  "Vietnam": [
    "An Giang", "Ba Ria-Vung Tau", "Bac Giang", "Bac Kan", "Bac Lieu",
    "Bac Ninh", "Ben Tre", "Binh Dinh", "Binh Duong", "Binh Phuoc",
    "Binh Thuan", "Ca Mau", "Can Tho", "Cao Bang", "Da Nang",
    "Dak Lak", "Dak Nong", "Dien Bien", "Dong Nai", "Dong Thap",
    "Gia Lai", "Ha Giang", "Ha Nam", "Ha Noi", "Ha Tinh",
    "Hai Duong", "Hai Phong", "Hau Giang", "Ho Chi Minh City",
    "Hoa Binh", "Hung Yen", "Khanh Hoa", "Kien Giang", "Kon Tum",
    "Lai Chau", "Lam Dong", "Lang Son", "Lao Cai", "Long An",
    "Nam Dinh", "Nghe An", "Ninh Binh", "Ninh Thuan", "Phu Tho",
    "Phu Yen", "Quang Binh", "Quang Nam", "Quang Ngai", "Quang Ninh",
    "Quang Tri", "Soc Trang", "Son La", "Tay Ninh", "Thai Binh",
    "Thai Nguyen", "Thanh Hoa", "Thua Thien Hue", "Tien Giang",
    "Tra Vinh", "Tuyen Quang", "Vinh Long", "Vinh Phuc", "Yen Bai",
  ],
};

/** Flag emoji for a country name (empty string when unknown). */
export function countryFlag(name: string | null | undefined): string {
  if (!name) return "";
  return COUNTRIES.find((c) => c.name === name)?.flag ?? "";
}
