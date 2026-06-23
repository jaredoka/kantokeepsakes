import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { id } = await params;

  let body: {
    status?: string;
    tradeAction?: "force_complete" | "cancel_trade";
    listingId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const validStatuses = ["reviewed", "resolved", "dismissed"];
  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be: reviewed, resolved, or dismissed." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Handle trade dispute actions
  if (body.tradeAction && body.listingId) {
    const { listingId, tradeAction } = body;

    // Get the listing and accepted offer
    const { data: listing } = await supabase
      .from("listings")
      .select("id, user_id, status")
      .eq("id", listingId)
      .single();

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    const { data: acceptedOffer } = await supabase
      .from("offers")
      .select("id, offerer_id")
      .eq("listing_id", listingId)
      .eq("status", "accepted")
      .limit(1)
      .maybeSingle();

    if (tradeAction === "force_complete") {
      // Force-complete: insert auto_completed rows for any party missing one,
      // then mark listing as sold
      const { data: completions } = await supabase
        .from("trade_completions")
        .select("user_id, status")
        .eq("listing_id", listingId);

      const parties = [
        listing.user_id,
        ...(acceptedOffer ? [acceptedOffer.offerer_id] : []),
      ];

      for (const partyId of parties) {
        const existing = (completions || []).find(
          (c) => c.user_id === partyId
        );
        if (!existing) {
          // Insert auto_completed for missing party
          await supabase.from("trade_completions").insert({
            listing_id: listingId,
            user_id: partyId,
            status: "auto_completed",
          });
        } else if (existing.status === "disputed") {
          // Replace dispute with auto_completed
          await supabase
            .from("trade_completions")
            .delete()
            .eq("listing_id", listingId)
            .eq("user_id", partyId);
          await supabase.from("trade_completions").insert({
            listing_id: listingId,
            user_id: partyId,
            status: "auto_completed",
          });
        }
      }

      // Mark listing as sold
      await supabase
        .from("listings")
        .update({ status: "sold" })
        .eq("id", listingId);
    } else if (tradeAction === "cancel_trade") {
      // Cancel trade: delete all trade_completions, decline the accepted offer,
      // set listing back to active
      await supabase
        .from("trade_completions")
        .delete()
        .eq("listing_id", listingId);

      if (acceptedOffer) {
        await supabase
          .from("offers")
          .update({ status: "declined" })
          .eq("id", acceptedOffer.id);
      }

      await supabase
        .from("listings")
        .update({ status: "active" })
        .eq("id", listingId);
    }
  }

  // Handle dismiss for trade disputes — delete the disputed row
  if (body.status === "dismissed") {
    // Get the report to check if it's a trade dispute
    const { data: report } = await supabase
      .from("reports")
      .select("reason, listing_id, reporter_id")
      .eq("id", id)
      .single();

    if (report?.reason === "trade_dispute" && report.listing_id) {
      // Delete the disputed party's trade_completions row so the timer restarts
      await supabase
        .from("trade_completions")
        .delete()
        .eq("listing_id", report.listing_id)
        .eq("user_id", report.reporter_id)
        .eq("status", "disputed");
    }
  }

  // Update report status
  const { error } = await supabase
    .from("reports")
    .update({ status: body.status })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update report." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
