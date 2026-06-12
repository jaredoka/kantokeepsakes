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

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Find the user with username "test"
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", "test")
    .single();

  if (profileError || !profile) {
    console.log("No user with username 'test' found. Checking case-insensitive...");

    // Try case-insensitive search
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", "test");

    if (!profiles || profiles.length === 0) {
      console.log("No 'test' user found in profiles table.");
      console.log("\nChecking for any listings with 'test' in username via join...");

      // List all profiles to help identify the test user
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, username")
        .order("created_at", { ascending: false })
        .limit(20);

      if (allProfiles) {
        console.log("Recent profiles:");
        for (const p of allProfiles) {
          console.log(`  - ${p.username} (${p.id})`);
        }
      }
      return;
    }

    for (const p of profiles) {
      await deleteListingsForUser(p.id, p.username);
    }
    return;
  }

  await deleteListingsForUser(profile.id, profile.username);
}

async function deleteListingsForUser(userId: string, username: string) {
  // Count listings first
  const { count } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  console.log(`Found ${count ?? 0} listings for user '${username}' (${userId})`);

  if (!count || count === 0) {
    console.log("No listings to delete.");
    return;
  }

  // Delete the listings
  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to delete listings:", error.message);
  } else {
    console.log(`Deleted ${count} listings from user '${username}'.`);
  }
}

main().catch(console.error);
