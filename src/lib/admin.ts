import { createClient } from "@/lib/supabase/server";

/**
 * Check whether the current authenticated user is an admin.
 * Returns the user ID if admin, null otherwise.
 */
export async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;

  return user.id;
}
