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

  let body: { status?: string };
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
