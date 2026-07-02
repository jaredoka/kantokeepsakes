import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/api-auth";
import { REPORT_REASONS, type ReportReason } from "@/lib/marketplace/types";

export async function POST(req: NextRequest) {
  const { user, supabase } = await getAuthUser(req);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Check ban status
  const { data: banProfile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  if (banProfile?.is_banned) {
    return NextResponse.json(
      { error: "Your account has been banned." },
      { status: 403 }
    );
  }

  let body: {
    reportedUserId?: string;
    listingId?: string;
    reason?: string;
    description?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { reportedUserId, listingId, reason, description } = body;

  if (!reportedUserId || !reason) {
    return NextResponse.json(
      { error: "reportedUserId and reason are required." },
      { status: 400 }
    );
  }

  if (!REPORT_REASONS.includes(reason as ReportReason)) {
    return NextResponse.json(
      { error: "Invalid report reason." },
      { status: 400 }
    );
  }

  if (reportedUserId === user.id) {
    return NextResponse.json(
      { error: "You cannot report yourself." },
      { status: 400 }
    );
  }

  if (description && description.length > 1000) {
    return NextResponse.json(
      { error: "Description must be 1000 characters or fewer." },
      { status: 400 }
    );
  }

  // Check for duplicate pending report from the same user for the same listing
  if (listingId) {
    const { data: existing } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("listing_id", listingId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You have already reported this listing." },
        { status: 409 }
      );
    }
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    listing_id: listingId || null,
    reason,
    description: description?.trim() || null,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to submit report." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
