import { supabase } from "@/src/lib/supabase";
import { report401 } from "@/src/lib/api/sessionExpiry";

/**
 * Browser-side fetch wrapper for local API proxies and direct API calls.
 *
 * Local `/api/*` routes authenticate with the HttpOnly `sb-access-token`
 * cookie. Repeating the same JWT in an Authorization header needlessly grows
 * every request and can push Node over its header-size limit when localhost
 * has cookies from several projects. Only direct, cross-origin API calls need
 * the browser SDK token attached.
 *
 * Mirrors `goalsFetch` in `src/lib/services/goals.ts`.
 */
export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const inputValue =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const target = new URL(inputValue, window.location.origin);
  const isSameOriginApi =
    target.origin === window.location.origin &&
    target.pathname.startsWith("/api/");

  if (isSameOriginApi) {
    const headers = new Headers(init.headers);
    headers.delete("Authorization");

    const res = await fetch(input, {
      ...init,
      headers,
      cache: init.cache ?? "no-store",
    });
    if (res.status === 401) report401();
    return res;
  }

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

  const res = await fetch(input, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });
  if (res.status === 401) report401();
  return res;
}
