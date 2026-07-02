import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * True when either user has blocked the other (B6). Uses the service-role
 * client: RLS deliberately hides the "who blocked me" direction from users.
 * Fails open (false) if the blocks table doesn't exist yet (pre-00023).
 */
export async function isBlockedEitherWay(
  userA: string,
  userB: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("blocks")
    .select("blocker_id")
    .or(
      `and(blocker_id.eq.${userA},blocked_id.eq.${userB}),and(blocker_id.eq.${userB},blocked_id.eq.${userA})`
    )
    .limit(1);
  if (error) return false;
  return (data || []).length > 0;
}
