import { NextRequest } from "next/server";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { createClient } from "./server";

export interface AuthResult {
  user: User | null;
  /** RLS-scoped client for the authenticated user (cookie- or token-bound) */
  supabase: SupabaseClient;
  /** How the user authenticated — mobile clients use "bearer" */
  via: "cookie" | "bearer" | null;
}

/**
 * Resolve the requesting user for an API route. Tries cookie-based auth
 * (web) first, then an `Authorization: Bearer <access_token>` header
 * (mobile). The returned supabase client is scoped so RLS applies as the
 * resolved user: for bearer auth this is a fresh client with the token
 * bound as the Authorization header — NOT the cookie client, which would
 * evaluate RLS as anon.
 */
export async function getAuthUser(request: NextRequest): Promise<AuthResult> {
  const cookieClient = await createClient();
  const {
    data: { user: cookieUser },
  } = await cookieClient.auth.getUser();
  if (cookieUser) return { user: cookieUser, supabase: cookieClient, via: "cookie" };

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const tokenClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        }
      );
      const {
        data: { user: tokenUser },
      } = await tokenClient.auth.getUser(token);
      if (tokenUser) return { user: tokenUser, supabase: tokenClient, via: "bearer" };
    }
  }

  return { user: null, supabase: cookieClient, via: null };
}
