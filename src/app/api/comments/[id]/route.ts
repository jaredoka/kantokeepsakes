import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/api-auth";

// DELETE — remove a comment. RLS enforces author-or-admin; we verify a row
// was actually deleted to distinguish success from silent RLS denial.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase } = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: deleted, error } = await supabase
    .from("listing_comments")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete comment." },
      { status: 500 }
    );
  }

  if (!deleted || deleted.length === 0) {
    return NextResponse.json(
      { error: "Comment not found or you cannot delete it." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
