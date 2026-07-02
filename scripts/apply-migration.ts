import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sql = `
-- Migration 00013: Add looking_for columns
ALTER TABLE listings ADD COLUMN IF NOT EXISTS looking_for_description text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS looking_for_images text[] DEFAULT '{}';

-- Migration 00014: Add wants_offers flag
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_offers boolean NOT NULL DEFAULT false;

-- Migration 00016: Add wants type flags
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_cash boolean NOT NULL DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_singles boolean NOT NULL DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_graded boolean NOT NULL DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wants_sealed boolean NOT NULL DEFAULT false;

-- Backfill wants_cash for listings with a price
UPDATE listings SET wants_cash = true WHERE price IS NOT NULL AND wants_cash = false;

-- Migration 00017: Add country/state columns
ALTER TABLE listings ADD COLUMN IF NOT EXISTS country text DEFAULT 'Brunei';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS state text;
UPDATE listings SET country = 'Brunei' WHERE country IS NULL;
CREATE INDEX IF NOT EXISTS idx_listings_country ON listings (country);

-- Notify PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';
`;

async function applyMigration() {
  console.log("Attempting to apply migration SQL...\n");

  // Try the Supabase SQL endpoint (used internally by the dashboard)
  const endpoints = [
    `${supabaseUrl}/rest/v1/rpc/`,
    `${supabaseUrl}/pg/query`,
  ];

  // Try using the SQL query endpoint (some Supabase versions expose this)
  for (const endpoint of endpoints) {
    console.log(`Trying endpoint: ${endpoint}`);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
        },
        body: JSON.stringify({ query: sql }),
      });
      const text = await res.text();
      console.log(`  Status: ${res.status}`);
      console.log(`  Response: ${text.substring(0, 500)}`);
      if (res.ok) {
        console.log("\nMigration applied successfully!");
        return;
      }
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }
  }

  // If none worked, output the SQL for manual execution
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Could not apply migrations automatically.");
  console.log("Please run the following SQL in your Supabase Dashboard SQL Editor:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(sql);
}

applyMigration().catch(console.error);
