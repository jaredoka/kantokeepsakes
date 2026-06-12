import { createClient } from "@/lib/supabase/server";

/**
 * Check whether the current authenticated user is banned.
 * Returns { banned: true, userId } if banned, { banned: false, userId } if not.
 * Returns { banned: false, userId: null } if not authenticated.
 */
export async function checkBan(): Promise<{
  banned: boolean;
  userId: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { banned: false, userId: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single();

  return {
    banned: !!profile?.is_banned,
    userId: user.id,
  };
}
