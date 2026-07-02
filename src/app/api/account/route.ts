import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/supabase/api-auth";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE — permanently delete the current user's account (B5).
// Required by App Store Guideline 5.1.1(v). Deleting the auth user cascades
// through profiles -> listings/offers/messages/etc. via ON DELETE CASCADE.
export async function DELETE(request: NextRequest) {
  const { user } = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Require explicit confirmation in the body — this is irreversible
  let body: { confirm?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { error: 'Confirmation required: send { "confirm": "DELETE" }.' },
      { status: 400 }
    );
  }

  // Best-effort: remove the user's uploaded images from storage
  // (DB cascade doesn't touch the storage bucket)
  try {
    const { data: files } = await supabaseAdmin.storage
      .from("listing-images")
      .list(user.id, { limit: 1000 });
    if (files && files.length > 0) {
      await supabaseAdmin.storage
        .from("listing-images")
        .remove(files.map((f) => `${user.id}/${f.name}`));
    }
  } catch (e) {
    console.error("[account] storage cleanup failed:", e);
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { error: "Failed to delete account." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
