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
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);

  if (session?.access_token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });
}
