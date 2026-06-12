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
  status: string;
  bumped_at: string;
  expires_at: string;
}

function listings(userIds: Record<string, string>): SeedListing[] {
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return [
    // ═══════════════════════════════════════════════════
    //  WTS listings
    // ═══════════════════════════════════════════════════

    {
      user_id: userIds["AshK_trainer"],
      type: "WTS",
      title: "[RAW] Charizard VMAX Rainbow Rare - Champion's Path",
      description:
        "Pulled this from a booster box. Card is in near-mint condition, went straight into a sleeve. No whitening on edges, centering is solid. Happy to send close-up photos on request. Looking for cash or would trade for [RAW] Blastoise ex SAR from 151.",
      category: "singles",
      language: "english",
      price: 161,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["MistyCerulean"],
      type: "WTS",
      title: "[PSA10] Pikachu Illustration Contest 2024 Promo #214",
      description:
        "PSA 10 Gem Mint slab of the Pikachu Illustration Contest promo. Case is clean with no scratches. Will ship with tracking and insurance. Price based on recent PSA 10 comps.",
      category: "graded",
      language: "japanese",
      price: 305,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["BrockPewter"],
      type: "WTS",
      title: "[SEALED] Pokemon 151 Booster Bundle (6 packs)",
      description:
        "Six sealed booster packs from the Scarlet & Violet 151 set. Packs are unweighed and come from a freshly opened Elite Trainer Box. Selling because I completed my set.",
      category: "sealed",
      language: "english",
      price: 175,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["GaryOakRival"],
      type: "WTS",
      title: "[RAW] Blastoise ex SAR 202/165 - Pokemon 151",
      description:
        "Special Art Rare Blastoise ex from the Japanese 151 set. Pack fresh, sleeved immediately. Centering looks great front and back. Also open to trading for [RAW] Venusaur ex SAR or [RAW] Charizard ex SAR from 151.",
      category: "singles",
      language: "japanese",
      price: 144,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["JessieRocket"],
      type: "WTS",
      title: "[SEALED] Japanese Eevee Heroes Booster Box",
      description:
        "Factory sealed Eevee Heroes booster box, Japanese version. Box is in excellent condition with no dents or tears on the shrink wrap. One of the best modern Japanese sets for Eeveelution fans.",
      category: "sealed",
      language: "japanese",
      price: 835,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["AshK_trainer"],
      type: "WTS",
      title: "[RAW] Mew VMAX Alt Art #269 - Fusion Strike",
      description:
        "Alt art Mew VMAX from Fusion Strike. Card is NM with clean edges and no surface scratches. A beautiful card for any collection. Price is firm based on recent sold comps.",
      category: "singles",
      language: "english",
      price: 188,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["MistyCerulean"],
      type: "WTS",
      title: "[PSA9] Umbreon VMAX Alt Art #215 - Evolving Skies",
      description:
        "PSA 9 Mint Umbreon VMAX Alternate Art from Evolving Skies. The most iconic modern Pokemon card. Slab is in perfect condition with no case scratches. Serious inquiries only.",
      category: "graded",
      language: "english",
      price: 2249,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["BrockPewter"],
      type: "WTS",
      title: "Ultra Pro Magnetic One-Touch 35pt Holders (10 pack)",
      description:
        "Brand new pack of 10 Ultra Pro magnetic card holders. UV protected, 35pt thickness - perfect for standard Pokemon cards. Never opened.",
      category: "accessories",
      language: "any",
      price: 18,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["GaryOakRival"],
      type: "WTS",
      title: "[SEALED] Scarlet & Violet Obsidian Flames ETB",
      description:
        "Sealed Elite Trainer Box from Obsidian Flames. Includes 9 booster packs, card sleeves, dice, and more. Box is in great shape with tight seal, perfect for opening or collecting.",
      category: "sealed",
      language: "english",
      price: 291,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["JessieRocket"],
      type: "WTS",
      title: "[RAW] Gengar VMAX Alt Art #271 - Fusion Strike",
      description:
        "Gengar VMAX alternate art from Fusion Strike. Near-mint condition, pulled and sleeved. One of my favorite artworks in the SWSH era. Selling to fund a grading submission.",
      category: "singles",
      language: "english",
      price: 897,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["AshK_trainer"],
      type: "WTS",
      title: "[PSA10] Charizard VMAX #20 - Darkness Ablaze",
      description:
        "PSA 10 Gem Mint Charizard VMAX from Darkness Ablaze. Clean slab, no scratches. One of the most popular modern Charizard cards in perfect grade. Price based on recent PSA 10 sales.",
      category: "graded",
      language: "english",
      price: 160,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 9 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["MistyCerulean"],
      type: "WTS",
      title: "[PSA9] Mew VMAX Alt Art #269 - Fusion Strike",
      description:
        "PSA 9 Mint Mew VMAX alternate art. Beautiful card in a clean slab. Would also consider trading for a [PSA9] or [PSA10] Moonbreon (Umbreon V Alt Art).",
      category: "graded",
      language: "english",
      price: 210,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 15 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["BrockPewter"],
      type: "WTS",
      title: "[SEALED] Japanese VSTAR Universe Booster Box",
      description:
        "Factory sealed VSTAR Universe booster box from Japan. One of the best sets for chase cards including the iconic God Pack. Perfect for ripping or holding as an investment.",
      category: "sealed",
      language: "japanese",
      price: 219,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },

    // ═══════════════════════════════════════════════════
    //  WTB listings
    // ═══════════════════════════════════════════════════

    {
      user_id: userIds["AshK_trainer"],
      type: "WTB",
      title: "[RAW] Gold Star Rayquaza #107 - EX Deoxys",
      description:
        "Searching for a Raw Gold Star Rayquaza from EX Deoxys. LP to NM preferred but will consider anything that isn't heavily damaged. Budget is around $5,000-$5,500 for the right card. Have cash and would also offer [PSA10] Charizard VMAX as partial trade.",
      category: "singles",
      language: "english",
      price: 5500,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["MistyCerulean"],
      type: "WTB",
      title: "[RAW] Umbreon V Alt Art #189 - Evolving Skies",
      description:
        "Looking for the Umbreon V alternate art (the Moonbreon) from Evolving Skies. Must be NM or better - planning to submit for grading. Willing to pay market price around $350-360 or trade from my collection of [PSA9] Japanese promos.",
      category: "singles",
      language: "english",
      price: 358,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["GaryOakRival"],
      type: "WTB",
      title: "[SEALED] Japanese VSTAR Universe Booster Boxes x2-3",
      description:
        "Looking to buy 2-3 sealed VSTAR Universe booster boxes at a reasonable price. Prefer to buy from someone local in Brunei for meetup, but will consider shipping if well-packaged. Budget is around B$280-300 per box.",
      category: "sealed",
      language: "japanese",
      price: 290,
      currency: "BND",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["BrockPewter"],
      type: "WTB",
      title: "[PSA7] or higher Base Set Starters - Charizard/Blastoise/Venusaur",
      description:
        "Collecting graded versions of the Base Set Charizard, Blastoise, and Venusaur (any print - unlimited or 1st edition). Looking for [PSA7] or higher, or [CGC7] or higher. Show me what you have and your asking price!",
      category: "graded",
      language: "english",
      price: null,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["JessieRocket"],
      type: "WTB",
      title: "[RAW] Meowth & Team Rocket themed cards - bulk",
      description:
        "Building a Team Rocket themed binder. Looking for any [RAW] cards featuring Meowth, Team Rocket, Dark Pokemon, or Rocket's Secret Machines. NM preferred but LP is fine too. Bulk deals preferred - will buy collections!",
      category: "singles",
      language: "any",
      price: null,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["GaryOakRival"],
      type: "WTB",
      title: "[PSA10] Gengar VMAX Alt Art #271 - Fusion Strike",
      description:
        "Looking for a PSA 10 Gengar VMAX Alt Art. This is my grail card. Budget is up to $2,500. Would also consider [PSA9] around $950. Must be a clean slab with no scratches.",
      category: "graded",
      language: "english",
      price: 2500,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      expires_at: expires,
    },
    {
      user_id: userIds["AshK_trainer"],
      type: "WTB",
      title: "[SEALED] Evolving Skies Booster Box - English",
      description:
        "Looking for a sealed English Evolving Skies booster box. This set has the best alt arts in the SWSH era. Need it to be factory sealed with no tears in the wrap. Send me your price!",
      category: "sealed",
      language: "english",
      price: null,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString(),
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

  // 4. Insert listings
  const listingData = listings(userIds);
  const { data: inserted, error: insertError } = await supabase
    .from("listings")
    .insert(listingData)
    .select("id, title");

  if (insertError) {
    console.error("  Failed to insert listings:", insertError.message);
  } else {
    console.log(`\n  Inserted ${inserted.length} listings:`);
    for (const l of inserted) {
      console.log(`    + ${l.title}`);
    }
  }

  console.log("\nDone!");
}

seed().catch(console.error);
