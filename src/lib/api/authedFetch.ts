import { supabase } from "@/src/lib/supabase";

/**
 * Browser-side fetch wrapper that attaches the current Supabase access token
 * as an `Authorization: Bearer <token>` header.
 *
 * Auth in this app is Supabase-based and lives client-side (localStorage), so
 * the local `/api/*` proxy routes read the token from the Authorization header
 * via `getAuthToken`. Plain `fetch` calls that omit the header get a 401 before
 * the request ever reaches Django. Use this helper for any authenticated call
 * to a local `/api/*` route from a client component.
 *
 * Mirrors `goalsFetch` in `src/lib/services/goals.ts`.
 */
export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const {
    data: { session },
    error: getSessionError,
  } = await supabase.auth.getSession();

  // TEMP DEBUG — remove after diagnosing prod auth-header loss
  console.log("[DEBUG authedFetch] url:", typeof input === "string" ? input : String(input));
  console.log("[DEBUG authedFetch] session present:", !!session);
  console.log("[DEBUG authedFetch] access_token present:", !!session?.access_token);
  console.log("[DEBUG authedFetch] getSession error:", getSessionError?.message ?? null);

  const headers = new Headers(init.headers);

  if (session?.access_token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  // TEMP DEBUG — remove after diagnosing prod auth-header loss
  console.log("[DEBUG authedFetch] Authorization header set on outgoing request:", headers.has("Authorization"));

  return fetch(input, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });
}
