import { supabase } from "./supabase";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://kantokeepsakes.com";

/**
 * Call a website API route with the current session's Bearer token.
 * All validated writes go through these routes (hybrid architecture, D6).
 */
export async function apiFetch<T = unknown>(
  route: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ ok: boolean; status: number; data: T | null; error: string | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let res: Response;
  try {
    res = await fetch(`${API_URL}${route}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    return { ok: false, status: 0, data: null, error: "Network error. Check your connection." };
  }

  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    // non-JSON response
  }

  const error =
    !res.ok && data && typeof data === "object" && "error" in data
      ? String((data as { error: unknown }).error)
      : !res.ok
        ? `Request failed (${res.status})`
        : null;

  return { ok: res.ok, status: res.status, data, error };
}
