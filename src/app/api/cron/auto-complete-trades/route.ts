import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const AUTO_COMPLETE_HOURS = 72;

/**
 * Cron endpoint: auto-completes trades where one party completed 72+ hours ago
 * and the other hasn't responded (no completion or dispute).
 * Protected by CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createClient();
  const cutoff = new Date(
    Date.now() - AUTO_COMPLETE_HOURS * 60 * 60 * 1000
  ).toISOString();

  // Find trade_completions where:
  // 1. Status is 'completed' (one party completed)
  // 2. Created more than 72h ago
  const { data: staleCompletions, error: fetchError } = await supabase
    .from("trade_completions")
    .select("listing_id, user_id")
    .eq("status", "completed")
    .lt("created_at", cutoff);

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch completions.", detail: fetchError.message },
      { status: 500 }
    );
  }

  if (!staleCompletions || staleCompletions.length === 0) {
    return NextResponse.json({
      autoCompleted: 0,
      timestamp: new Date().toISOString(),
    });
  }

  // Get unique listing IDs
  const listingIds = [...new Set(staleCompletions.map((c) => c.listing_id))];
  let autoCompletedCount = 0;

  for (const listingId of listingIds) {
    // Get all completions for this listing
    const { data: allCompletions } = await supabase
      .from("trade_completions")
      .select("user_id, status")
      .eq("listing_id", listingId);

    if (!allCompletions) continue;

    // Skip if already both completed
    const doneCount = allCompletions.filter(
      (c) => c.status === "completed" || c.status === "auto_completed"
    ).length;
    if (doneCount >= 2) continue;

    // Skip if there's a dispute — admin must handle
    const hasDispute = allCompletions.some((c) => c.status === "disputed");
    if (hasDispute) continue;

    // Find the party that hasn't completed
    const { data: listing } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", listingId)
      .single();

    const { data: acceptedOffer } = await supabase
      .from("offers")
      .select("offerer_id")
      .eq("listing_id", listingId)
      .eq("status", "accepted")
      .limit(1)
      .maybeSingle();

    if (!listing || !acceptedOffer) continue;

    const parties = [listing.user_id, acceptedOffer.offerer_id];
    const completedUserIds = allCompletions
      .filter((c) => c.status === "completed" || c.status === "auto_completed")
      .map((c) => c.user_id);

    const missingParty = parties.find((p) => !completedUserIds.includes(p));
    if (!missingParty) continue;

    // Auto-complete for the missing party
    const { error: insertError } = await supabase
      .from("trade_completions")
      .insert({
        listing_id: listingId,
        user_id: missingParty,
        status: "auto_completed",
      });

    if (insertError) continue;

    // Mark listing as sold
    await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", listingId);

    autoCompletedCount++;
  }

  return NextResponse.json({
    autoCompleted: autoCompletedCount,
    timestamp: new Date().toISOString(),
  });
}
