import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local without dotenv
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  process.env[key] = val;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Fake users ──────────────────────────────────────────────
const USERS = [
  { email: "ash@example.com", username: "AshK_trainer", password: "password123" },
  { email: "misty@example.com", username: "MistyCerulean", password: "password123" },
  { email: "brock@example.com", username: "BrockPewter", password: "password123" },
  { email: "gary@example.com", username: "GaryOakRival", password: "password123" },
  { email: "jessie@example.com", username: "JessieRocket", password: "password123" },
];

// ── Listing data ────────────────────────────────────────────
interface SeedListing {
  user_id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  language: string;
  price: number | null;
  currency: string;
  images: string[];
  looking_for_images: string[];
  wants_cash: boolean;
  wants_offers: boolean;
  wants_singles: boolean;
  wants_graded: boolean;
  wants_sealed: boolean;
  status: string;
  bumped_at: string;
  expires_at: string;
}

// Default want fields for listings that only want cash
const WANTS_CASH_ONLY = { looking_for_images: [] as string[], wants_cash: true, wants_offers: false, wants_singles: false, wants_graded: false, wants_sealed: false };
const WANTS_OFFERS = { looking_for_images: [] as string[], wants_cash: false, wants_offers: true, wants_singles: false, wants_graded: false, wants_sealed: false };
const WANTS_NONE = { looking_for_images: [] as string[], wants_cash: false, wants_offers: false, wants_singles: false, wants_graded: false, wants_sealed: false };

function listings(userIds: Record<string, string>): SeedListing[] {
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const hr = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

  return [
    // ═══════════════════════════════════════════════════
    //  WTS listings
    // ═══════════════════════════════════════════════════

    {
      user_id: userIds["AshK_trainer"],
      type: "WTS",
      title: "[H] Charizard VMAX Rainbow [W] Cash",
      description:
        "Pulled this from a booster box. Card is in near-mint condition, went straight into a sleeve. No whitening on edges, centering is solid. Happy to send close-up photos on request.",
      category: "singles",
      language: "english",
      price: 161,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh3.5/74/high.webp"],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(2),
      expires_at: expires,
    },
    {
      user_id: userIds["MistyCerulean"],
      type: "WTS",
      title: "[H] PSA 9 Umbreon VMAX Alt Art [W] Cash",
      description:
        "PSA 9 Mint Umbreon VMAX Alternate Art from Evolving Skies. The most iconic modern Pokemon card. Slab is in perfect condition with no case scratches. Serious inquiries only.",
      category: "graded",
      language: "english",
      price: 2249,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp"],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(0.5),
      expires_at: expires,
    },
    {
      user_id: userIds["JessieRocket"],
      type: "WTS",
      title: "[H] Dark Charizard Holo [W] Cash",
      description:
        "1st Edition Dark Charizard Holo from Team Rocket. Near-mint condition. A true vintage gem.",
      category: "singles",
      language: "english",
      price: 8000,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/base/base5/4/high.webp"],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(0.5),
      expires_at: expires,
    },
    {
      user_id: userIds["AshK_trainer"],
      type: "WTS",
      title: "[H] Sealed Surging Sparks Box [W] Cash",
      description:
        "Fresh sealed Surging Sparks booster box, English. Great pull rates with Pikachu ex SAR chase card.",
      category: "sealed",
      language: "english",
      price: 125,
      currency: "USD",
      images: [],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(1.5),
      expires_at: expires,
    },
    {
      user_id: userIds["AshK_trainer"],
      type: "WTS",
      title: "[H] PSA 10 Charizard VMAX [W] Cash",
      description:
        "PSA 10 Gem Mint Charizard VMAX from Darkness Ablaze. Clean slab, no scratches.",
      category: "graded",
      language: "english",
      price: 160,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh3/20/high.webp"],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(9),
      expires_at: expires,
    },

    // ── WTS with trade wants (looking_for_images populated) ──

    {
      user_id: userIds["MistyCerulean"],
      type: "WTS",
      title: "[H] Espeon V Alt Art [W] Eeveelution Alt Arts",
      description:
        "Espeon V alternate art from Evolving Skies. NM condition. Trade only — looking for Eeveelution alt arts I'm missing.",
      category: "singles",
      language: "english",
      price: null,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh7/64/high.webp"],
      looking_for_images: [
        "https://assets.tcgdex.net/en/swsh/swsh7/167/high.webp",  // Leafeon V Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/175/high.webp",  // Glaceon V Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/184/high.webp",  // Sylveon V Alt
      ],
      wants_cash: false,
      wants_offers: false,
      wants_singles: true,
      wants_graded: false,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(1),
      expires_at: expires,
    },
    {
      user_id: userIds["GaryOakRival"],
      type: "WTS",
      title: "[H] Blastoise ex SAR [W] Venusaur or Charizard SAR",
      description:
        "Special Art Rare Blastoise ex from the Japanese 151 set. Pack fresh. Trading for Venusaur ex SAR or Charizard ex SAR from 151.",
      category: "singles",
      language: "japanese",
      price: null,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/sv/sv03.5/199/high.webp"],
      looking_for_images: [
        "https://assets.tcgdex.net/en/sv/sv03.5/200/high.webp",  // Venusaur ex SAR
        "https://assets.tcgdex.net/en/sv/sv03.5/201/high.webp",  // Charizard ex SAR
      ],
      wants_cash: false,
      wants_offers: true,
      wants_singles: true,
      wants_graded: false,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(12),
      expires_at: expires,
    },
    {
      user_id: userIds["MistyCerulean"],
      type: "WTS",
      title: "[H] Giratina V Alt Art [W] Evolving Skies Alt Arts",
      description:
        "Giratina V alternate art from Lost Origin. NM condition. Will trade for Evolving Skies alt arts.",
      category: "singles",
      language: "english",
      price: null,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh11/130/high.webp"],
      looking_for_images: [
        "https://assets.tcgdex.net/en/swsh/swsh7/188/high.webp",  // Umbreon V Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp",  // Umbreon VMAX Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/218/high.webp",  // Rayquaza VMAX Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/203/high.webp",  // Dragonite V Alt
      ],
      wants_cash: true,
      wants_offers: false,
      wants_singles: true,
      wants_graded: false,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(11),
      expires_at: expires,
    },
    {
      user_id: userIds["JessieRocket"],
      type: "WTS",
      title: "[H] Gengar VMAX Alt Art [W] Cash or Trades",
      description:
        "Gengar VMAX alternate art from Fusion Strike. Near-mint condition. Selling or trading.",
      category: "singles",
      language: "english",
      price: 897,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh8/271/high.webp"],
      looking_for_images: [
        "https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp",  // Umbreon VMAX Alt
      ],
      wants_cash: true,
      wants_offers: true,
      wants_singles: true,
      wants_graded: false,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(6),
      expires_at: expires,
    },
    {
      user_id: userIds["GaryOakRival"],
      type: "WTS",
      title: "[H] PSA 9 Rayquaza VMAX Alt [W] High-End Slabs",
      description:
        "PSA 9 Mint Rayquaza VMAX alternate art from Evolving Skies. Cash or trade for other high-end PSA slabs.",
      category: "graded",
      language: "english",
      price: 420,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh7/218/high.webp"],
      looking_for_images: [
        "https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp",  // Umbreon VMAX Alt
        "https://assets.tcgdex.net/en/swsh/swsh8/271/high.webp",  // Gengar VMAX Alt
      ],
      wants_cash: true,
      wants_offers: false,
      wants_singles: false,
      wants_graded: true,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(2.5),
      expires_at: expires,
    },
    {
      user_id: userIds["BrockPewter"],
      type: "WTS",
      title: "[H] Sealed 151 Bundle [W] Cash",
      description:
        "Six sealed booster packs from the Scarlet & Violet 151 set. Unweighed.",
      category: "sealed",
      language: "english",
      price: 175,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/sv/sv03.5/009/high.webp"],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(8),
      expires_at: expires,
    },
    {
      user_id: userIds["AshK_trainer"],
      type: "WTS",
      title: "[H] Mew VMAX Alt Art [W] Cash",
      description:
        "Alt art Mew VMAX from Fusion Strike. NM. Price is firm.",
      category: "singles",
      language: "english",
      price: 188,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh8/268/high.webp"],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(3),
      expires_at: expires,
    },
    {
      user_id: userIds["MistyCerulean"],
      type: "WTS",
      title: "[H] PSA 9 Mew VMAX Alt Art [W] Moonbreon Trade",
      description:
        "PSA 9 Mint Mew VMAX alternate art. Would also consider trading for a PSA 9 Moonbreon.",
      category: "graded",
      language: "english",
      price: 210,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh8/268/high.webp"],
      looking_for_images: [
        "https://assets.tcgdex.net/en/swsh/swsh7/188/high.webp",  // Umbreon V Alt (Moonbreon)
      ],
      wants_cash: true,
      wants_offers: false,
      wants_singles: false,
      wants_graded: true,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(15),
      expires_at: expires,
    },
    {
      user_id: userIds["AshK_trainer"],
      type: "WTS",
      title: "[H] Pikachu VMAX Rainbow [W] JP Promos or Cash",
      description:
        "Chonkachu! Pikachu VMAX rainbow rare from Vivid Voltage. NM+. Trade for Japanese promos or sell.",
      category: "singles",
      language: "english",
      price: 245,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh4/44/high.webp"],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(13),
      expires_at: expires,
    },
    {
      user_id: userIds["JessieRocket"],
      type: "WTS",
      title: "[H] Sealed Shiny Treasure ex Box [W] Cash",
      description:
        "Factory sealed Shiny Treasure ex booster box. Amazing set with shiny versions of popular Pokemon.",
      category: "sealed",
      language: "japanese",
      price: 68,
      currency: "USD",
      images: [],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(16),
      expires_at: expires,
    },
    {
      user_id: userIds["BrockPewter"],
      type: "WTS",
      title: "[H] Sealed Prismatic Evolutions ETB x2 [W] Cash",
      description:
        "Two sealed Prismatic Evolutions Elite Trainer Boxes. Perfect condition.",
      category: "sealed",
      language: "english",
      price: 95,
      currency: "USD",
      images: [],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(4.5),
      expires_at: expires,
    },

    // ═══════════════════════════════════════════════════
    //  WTB listings
    // ═══════════════════════════════════════════════════

    {
      user_id: userIds["AshK_trainer"],
      type: "WTB",
      title: "[H] Cash $5500 [W] Gold Star Rayquaza",
      description:
        "Searching for a Raw Gold Star Rayquaza from EX Deoxys. LP to NM preferred.",
      category: "singles",
      language: "english",
      price: 5500,
      currency: "USD",
      images: [],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(1),
      expires_at: expires,
    },
    {
      user_id: userIds["MistyCerulean"],
      type: "WTB",
      title: "[H] Cash or PSA Promos [W] Umbreon V Alt Art",
      description:
        "Looking for the Umbreon V alternate art (the Moonbreon). Must be NM+. Can pay or trade PSA 9 JP promos.",
      category: "singles",
      language: "english",
      price: 358,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh7/188/high.webp"],
      looking_for_images: [
        "https://assets.tcgdex.net/en/swsh/swsh7/188/high.webp",  // Moonbreon
      ],
      wants_cash: true,
      wants_offers: false,
      wants_singles: true,
      wants_graded: false,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(10),
      expires_at: expires,
    },
    {
      user_id: userIds["GaryOakRival"],
      type: "WTB",
      title: "[H] Cash [W] Sealed VSTAR Universe Boxes",
      description:
        "Looking to buy 2-3 sealed VSTAR Universe booster boxes. Budget ~B$280-300 per box.",
      category: "sealed",
      language: "japanese",
      price: 290,
      currency: "BND",
      images: [],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(18),
      expires_at: expires,
    },
    {
      user_id: userIds["BrockPewter"],
      type: "WTB",
      title: "[H] Cash [W] PSA 7+ Base Set Starters",
      description:
        "Collecting graded Base Set Charizard #4, Blastoise #2, Venusaur #15. PSA 7+.",
      category: "graded",
      language: "english",
      price: null,
      currency: "USD",
      images: [],
      looking_for_images: [
        "https://assets.tcgdex.net/en/base/base1/4/high.webp",  // Charizard
        "https://assets.tcgdex.net/en/base/base1/2/high.webp",  // Blastoise
        "https://assets.tcgdex.net/en/base/base1/15/high.webp", // Venusaur
      ],
      wants_cash: false,
      wants_offers: true,
      wants_singles: false,
      wants_graded: true,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(14),
      expires_at: expires,
    },
    {
      user_id: userIds["JessieRocket"],
      type: "WTB",
      title: "[H] Cash [W] Meowth & Team Rocket Cards",
      description:
        "Building a Team Rocket themed binder. Looking for bulk Meowth and Dark Pokemon cards.",
      category: "singles",
      language: "any",
      price: null,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/base/basep/10/high.webp"],
      ...WANTS_OFFERS,
      status: "active",
      bumped_at: hr(20),
      expires_at: expires,
    },
    {
      user_id: userIds["GaryOakRival"],
      type: "WTB",
      title: "[H] Cash $2500 [W] PSA 10 Gengar VMAX Alt",
      description:
        "Grail card. Budget up to $2,500. Also consider PSA 9 ~$950.",
      category: "graded",
      language: "english",
      price: 2500,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh8/271/high.webp"],
      looking_for_images: [
        "https://assets.tcgdex.net/en/swsh/swsh8/271/high.webp",  // Gengar VMAX Alt
      ],
      wants_cash: true,
      wants_offers: false,
      wants_singles: false,
      wants_graded: true,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(3),
      expires_at: expires,
    },
    {
      user_id: userIds["MistyCerulean"],
      type: "WTB",
      title: "[H] Cash [W] Eeveelution Alt Arts from Evolving Skies",
      description:
        "Need Leafeon V, Glaceon V, Sylveon V alt arts to complete my set. NM only.",
      category: "singles",
      language: "english",
      price: null,
      currency: "USD",
      images: [],
      looking_for_images: [
        "https://assets.tcgdex.net/en/swsh/swsh7/167/high.webp",
        "https://assets.tcgdex.net/en/swsh/swsh7/175/high.webp",
        "https://assets.tcgdex.net/en/swsh/swsh7/184/high.webp",
      ],
      wants_cash: false,
      wants_offers: false,
      wants_singles: true,
      wants_graded: false,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(2),
      expires_at: expires,
    },
    {
      user_id: userIds["GaryOakRival"],
      type: "WTB",
      title: "[H] Cash or Blastoise SAR [W] Charizard ex SAR 151",
      description:
        "Last card for my 151 SAR master set. Can pay cash or trade Blastoise ex SAR + cash.",
      category: "singles",
      language: "japanese",
      price: 280,
      currency: "USD",
      images: [],
      looking_for_images: [
        "https://assets.tcgdex.net/en/sv/sv03.5/201/high.webp",  // Charizard ex SAR
      ],
      wants_cash: true,
      wants_offers: false,
      wants_singles: true,
      wants_graded: false,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(4),
      expires_at: expires,
    },

    // ═══════════════════════════════════════════════════
    //  SHOWCASE: 10 Haves + 10 Wants thumbnails
    // ═══════════════════════════════════════════════════

    {
      user_id: userIds["BrockPewter"],
      type: "WTS",
      title: "[H] 151 SAR Collection [W] Evolving Skies Alt Arts",
      description:
        "Trading my full 151 Special Art Rare collection for Evolving Skies alternate art singles. All cards are NM pack-fresh. Willing to do 1-for-1 trades on comparable cards or work out a multi-card deal. Also open to cash offers on individual cards.",
      category: "singles",
      language: "english",
      price: null,
      currency: "USD",
      images: [
        "https://assets.tcgdex.net/en/sv/sv03.5/198/high.webp",  // Alakazam ex SAR
        "https://assets.tcgdex.net/en/sv/sv03.5/199/high.webp",  // Blastoise ex SAR
        "https://assets.tcgdex.net/en/sv/sv03.5/200/high.webp",  // Venusaur ex SAR
        "https://assets.tcgdex.net/en/sv/sv03.5/201/high.webp",  // Charizard ex SAR
        "https://assets.tcgdex.net/en/sv/sv03.5/202/high.webp",  // Arcanine ex SAR
        "https://assets.tcgdex.net/en/sv/sv03.5/203/high.webp",  // Mew ex SAR
        "https://assets.tcgdex.net/en/sv/sv03.5/204/high.webp",  // Erika's Invitation SAR
        "https://assets.tcgdex.net/en/sv/sv03.5/205/high.webp",  // Bill's Transfer SAR
        "https://assets.tcgdex.net/en/sv/sv03.5/206/high.webp",  // Giovanni's Charisma SAR
        "https://assets.tcgdex.net/en/sv/sv03.5/207/high.webp",  // Zapdos ex SAR
      ],
      looking_for_images: [
        "https://assets.tcgdex.net/en/swsh/swsh7/167/high.webp",  // Leafeon V Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/175/high.webp",  // Glaceon V Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/184/high.webp",  // Sylveon V Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/188/high.webp",  // Umbreon V Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/203/high.webp",  // Dragonite V Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp",  // Umbreon VMAX Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/218/high.webp",  // Rayquaza VMAX Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/204/high.webp",  // Noivern V Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/211/high.webp",  // Glaceon VMAX Alt
        "https://assets.tcgdex.net/en/swsh/swsh7/212/high.webp",  // Espeon VMAX Alt
      ],
      wants_cash: true,
      wants_offers: false,
      wants_singles: true,
      wants_graded: false,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(0.1),
      expires_at: expires,
    },

    // More listings with various want configs

    {
      user_id: userIds["AshK_trainer"],
      type: "WTS",
      title: "[H] Lugia V Alt Art [W] Singles or Graded",
      description:
        "Lugia V alternate art from Silver Tempest. NM. Open to trading for other alt arts or graded cards.",
      category: "singles",
      language: "english",
      price: 175,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/swsh/swsh12/186/high.webp"],
      looking_for_images: [
        "https://assets.tcgdex.net/en/swsh/swsh8/268/high.webp",  // Mew VMAX Alt
        "https://assets.tcgdex.net/en/swsh/swsh8/271/high.webp",  // Gengar VMAX Alt
        "https://assets.tcgdex.net/en/swsh/swsh11/130/high.webp", // Giratina V Alt
      ],
      wants_cash: true,
      wants_offers: false,
      wants_singles: true,
      wants_graded: true,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(5),
      expires_at: expires,
    },
    {
      user_id: userIds["JessieRocket"],
      type: "WTS",
      title: "[H] Miraidon ex SAR [W] Any Offers",
      description:
        "Japanese Miraidon ex Special Art Rare. Pack fresh NM. Open to any offers.",
      category: "singles",
      language: "japanese",
      price: 72,
      currency: "USD",
      images: ["https://assets.tcgdex.net/en/sv/sv01/253/high.webp"],
      ...WANTS_OFFERS,
      status: "active",
      bumped_at: hr(7),
      expires_at: expires,
    },
    {
      user_id: userIds["BrockPewter"],
      type: "WTS",
      title: "[H] Sealed VSTAR Universe Box [W] Cash",
      description:
        "Factory sealed VSTAR Universe booster box from Japan.",
      category: "sealed",
      language: "japanese",
      price: 219,
      currency: "USD",
      images: [],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(20),
      expires_at: expires,
    },
    {
      user_id: userIds["GaryOakRival"],
      type: "WTS",
      title: "[H] Sealed Obsidian Flames ETB [W] Cash or Sealed",
      description:
        "Sealed Elite Trainer Box from Obsidian Flames. Trade for other sealed or sell.",
      category: "sealed",
      language: "english",
      price: 291,
      currency: "USD",
      images: [],
      wants_cash: true,
      wants_offers: false,
      wants_singles: false,
      wants_graded: false,
      wants_sealed: true,
      looking_for_images: [],
      status: "active",
      bumped_at: hr(5),
      expires_at: expires,
    },
    {
      user_id: userIds["JessieRocket"],
      type: "WTS",
      title: "[H] Sealed Eevee Heroes Box [W] Cash",
      description:
        "Factory sealed Eevee Heroes booster box, Japanese. Excellent condition.",
      category: "sealed",
      language: "japanese",
      price: 835,
      currency: "USD",
      images: [],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(24),
      expires_at: expires,
    },
    {
      user_id: userIds["MistyCerulean"],
      type: "WTB",
      title: "[H] Cash [W] PSA 10 Vaporeon VMAX Eevee Heroes",
      description:
        "Need PSA 10 Japanese Vaporeon VMAX to complete my Eeveelution VMAX set.",
      category: "graded",
      language: "japanese",
      price: 145,
      currency: "USD",
      images: [],
      looking_for_images: [
        "https://assets.tcgdex.net/en/swsh/swsh7/30/high.webp",
      ],
      wants_cash: true,
      wants_offers: false,
      wants_singles: false,
      wants_graded: true,
      wants_sealed: false,
      status: "active",
      bumped_at: hr(8),
      expires_at: expires,
    },
    {
      user_id: userIds["BrockPewter"],
      type: "WTB",
      title: "[H] Cash [W] Sealed Japanese 151 Boxes",
      description:
        "Looking for sealed Japanese 151 booster boxes. 2-3 preferred.",
      category: "sealed",
      language: "japanese",
      price: 195,
      currency: "USD",
      images: [],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(6),
      expires_at: expires,
    },
    {
      user_id: userIds["AshK_trainer"],
      type: "WTB",
      title: "[H] Cash [W] Sealed Evolving Skies Box",
      description:
        "Looking for a sealed English Evolving Skies booster box. Factory sealed only.",
      category: "sealed",
      language: "english",
      price: null,
      currency: "USD",
      images: [],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(7),
      expires_at: expires,
    },
    {
      user_id: userIds["JessieRocket"],
      type: "WTB",
      title: "[H] Cash [W] Sealed Team Rocket Returns Packs",
      description:
        "Hunting for sealed Team Rocket Returns booster packs. Any artwork.",
      category: "sealed",
      language: "english",
      price: 450,
      currency: "USD",
      images: [],
      ...WANTS_CASH_ONLY,
      status: "active",
      bumped_at: hr(10),
      expires_at: expires,
    },
  ];
}

// ── Main ────────────────────────────────────────────────────
async function seed() {
  console.log("Seeding database...\n");

  // 1. Create users
  const userIds: Record<string, string> = {};

  for (const user of USERS) {
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === user.email);

    if (existing) {
      console.log(`  User ${user.username} already exists (${existing.id})`);
      userIds[user.username] = existing.id;
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { username: user.username },
    });

    if (error) {
      console.error(`  Failed to create user ${user.username}:`, error.message);
      continue;
    }

    console.log(`  Created user ${user.username} (${data.user.id})`);
    userIds[user.username] = data.user.id;
  }

  // 2. Update profiles with trade history
  const profileUpdates: Record<string, { reputation_score: number; completed_trades: number }> = {
    AshK_trainer: { reputation_score: 45, completed_trades: 12 },
    MistyCerulean: { reputation_score: 78, completed_trades: 28 },
    BrockPewter: { reputation_score: 32, completed_trades: 8 },
    GaryOakRival: { reputation_score: 15, completed_trades: 3 },
    JessieRocket: { reputation_score: 5, completed_trades: 1 },
  };

  for (const [username, updates] of Object.entries(profileUpdates)) {
    const userId = userIds[username];
    if (!userId) continue;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      console.error(`  Failed to update profile for ${username}:`, error.message);
    } else {
      console.log(`  Updated profile: ${username} (${updates.completed_trades} trades, ${updates.reputation_score} rep)`);
    }
  }

  // 3. Clear existing seed listings (if re-running)
  const allUserIds = Object.values(userIds);
  if (allUserIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("listings")
      .delete()
      .in("user_id", allUserIds);

    if (deleteError) {
      console.error("  Failed to clear old listings:", deleteError.message);
    } else {
      console.log("\n  Cleared old listings for seed users");
    }
  }

  // 4. Insert listings (two-phase: core fields, then newer columns)
  const listingData = listings(userIds);

  // Phase A: Insert with only core columns that always exist
  const coreRows = listingData.map(({ looking_for_images, wants_cash, wants_offers, wants_singles, wants_graded, wants_sealed, ...core }) => core);

  const { data: inserted, error: insertError } = await supabase
    .from("listings")
    .insert(coreRows)
    .select("id, title");

  if (insertError) {
    console.error("  Failed to insert listings:", insertError.message);
    console.log("\nDone (with errors)!");
    return;
  }

  console.log(`\n  Inserted ${inserted.length} listings:`);
  for (const l of inserted) {
    console.log(`    + ${l.title}`);
  }

  // Phase B: Update with newer columns (looking_for_images, wants_* flags)
  // These columns may not exist if migrations 13-17 haven't been applied
  let updatedCount = 0;
  let updateFailed = false;

  for (let i = 0; i < inserted.length; i++) {
    const listing = listingData[i];
    const id = inserted[i].id;

    const extraFields: Record<string, unknown> = {};
    if (listing.looking_for_images && listing.looking_for_images.length > 0) {
      extraFields.looking_for_images = listing.looking_for_images;
    }
    if (listing.wants_cash) extraFields.wants_cash = true;
    if (listing.wants_offers) extraFields.wants_offers = true;
    if (listing.wants_singles) extraFields.wants_singles = true;
    if (listing.wants_graded) extraFields.wants_graded = true;
    if (listing.wants_sealed) extraFields.wants_sealed = true;

    if (Object.keys(extraFields).length === 0) continue;

    const { error: updateError } = await supabase
      .from("listings")
      .update(extraFields)
      .eq("id", id);

    if (updateError) {
      if (!updateFailed) {
        console.log("\n  ⚠ Could not update newer columns (migrations 13-17 may not be applied):");
        console.log(`    ${updateError.message}`);
        console.log("    Run the following SQL in Supabase Dashboard → SQL Editor:");
        console.log("    ─────────────────────────────────────────────────────────");
        console.log("    ALTER TABLE listings ADD COLUMN IF NOT EXISTS looking_for_images text[] DEFAULT '{}';");
        console.log("    ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_offers boolean NOT NULL DEFAULT false;");
        console.log("    ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_cash boolean NOT NULL DEFAULT false;");
        console.log("    ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_singles boolean NOT NULL DEFAULT false;");
        console.log("    ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_graded boolean NOT NULL DEFAULT false;");
        console.log("    ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_sealed boolean NOT NULL DEFAULT false;");
        console.log("    NOTIFY pgrst, 'reload schema';");
        console.log("    ─────────────────────────────────────────────────────────");
        console.log("    Then re-run this seed script.");
        updateFailed = true;
      }
      break;
    } else {
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    console.log(`\n  Updated ${updatedCount} listings with wants/looking_for data`);
  }

  console.log("\nDone!");
}

seed().catch(console.error);
