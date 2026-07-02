import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/api-auth";
import { matchListing } from "@/lib/marketplace/matching";
import type { Listing, ListingWithProfile } from "@/lib/marketplace/types";

/** Same candidate cap as the matches page */
const CANDIDATE_LIMIT = 500;

// GET — have/want matches for the current user's active listings (B3).
// Mirrors /marketplace/matches for mobile clients.
export async function GET(request: NextRequest) {
  const { user, supabase } = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [{ data: myListings }, { data: candidates }] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("listings")
      .select(
        "*, profiles!listings_user_id_fkey(username, reputation_score, completed_trades)"
      )
      .eq("status", "active")
      .neq("user_id", user.id)
      .order("bumped_at", { ascending: false })
      .limit(CANDIDATE_LIMIT),
  ]);

  const pool = (candidates || []) as ListingWithProfile[];
  const sections = ((myListings || []) as Listing[])
    .map((listing) => ({
      listing,
      matches: matchListing(listing, pool),
    }))
    .filter((s) => s.matches.length > 0);

  return NextResponse.json({ sections });
}
