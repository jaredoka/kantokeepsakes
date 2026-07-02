import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function check() {
  // Test 1: Can we select these columns?
  const { data: selData, error: selErr } = await supabase
    .from("listings")
    .select("id, looking_for_images, wants_cash, wants_offers, wants_singles, wants_graded, wants_sealed, country, state")
    .limit(1);

  console.log("SELECT test:");
  if (selErr) {
    console.log("  ERROR:", selErr.message);
  } else {
    console.log("  OK - columns exist. Row:", JSON.stringify(selData));
  }

  // Test 2: Try inserting with just core fields (no new columns)
  const { error: insertErr } = await supabase
    .from("listings")
    .insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      type: "WTS",
      title: "test",
      description: "test",
      category: "singles",
      language: "english",
      price: 10,
      currency: "USD",
      images: [],
      status: "active",
      bumped_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
    })
    .select("id");

  console.log("\nINSERT (core fields only):");
  if (insertErr) {
    console.log("  ERROR:", insertErr.message);
  } else {
    console.log("  OK");
  }

  // Test 3: Try inserting with looking_for_images
  const { error: insertErr2 } = await supabase
    .from("listings")
    .insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      type: "WTS",
      title: "test2",
      description: "test2",
      category: "singles",
      language: "english",
      price: 10,
      currency: "USD",
      images: [],
      looking_for_images: ["http://example.com/card.webp"],
      status: "active",
      bumped_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
    })
    .select("id");

  console.log("\nINSERT (with looking_for_images):");
  if (insertErr2) {
    console.log("  ERROR:", insertErr2.message);
  } else {
    console.log("  OK");
  }
}

check().catch(console.error);
