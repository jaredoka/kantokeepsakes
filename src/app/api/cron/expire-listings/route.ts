import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cron endpoint: marks active listings past their expires_at as expired.
 * Intended to be called by Vercel Cron (vercel.json) or external scheduler.
 * Protected by CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: "Failed to expire listings.", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    expired: data?.length || 0,
    timestamp: new Date().toISOString(),
  });
}
