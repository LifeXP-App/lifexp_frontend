import { supabase } from "@/src/lib/supabase";
import { report401 } from "@/src/lib/api/sessionExpiry";
import { refreshBrowserSession } from "@/src/lib/auth/refreshBrowserSession";

/**
 * Browser-side fetch wrapper for local API proxies and direct API calls.
 *
 * Local `/api/*` routes authenticate with the HttpOnly `sb-access-token`
 * cookie. Repeating the same JWT in an Authorization header needlessly grows
 * every request and can push Node over its header-size limit when localhost
 * has cookies from several projects. Only direct, cross-origin API calls need
 * the browser SDK token attached.
 *
 * Either way a 401 is retried exactly once behind a token refresh. The server
 * cannot refresh on the client's behalf (see `refreshTokens`), so the proxy
 * routes answer a stale cookie with 401 and rely on this retry to heal it.
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

    let res = await fetch(input, {
      ...init,
      headers,
      cache: init.cache ?? "no-store",
    });

    // A 401 from a proxy route means the mirrored `sb-access-token` cookie
    // expired. refreshBrowserSession() spends the refresh token (the browser is
    // its only owner) and re-syncs the cookies, so the retry goes out with a
    // fresh generation. Only a refresh that genuinely fails is a dead session.
    if (res.status === 401 && (await refreshBrowserSession())) {
      res = await fetch(input, {
        ...init,
        headers,
        cache: init.cache ?? "no-store",
      });
    }

    if (res.status === 401) report401();
    return res;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  const callerSetAuth = headers.has("Authorization");

  if (session?.access_token && !callerSetAuth) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  let res = await fetch(input, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });

  // A 401 here is usually a just-expired access token, not a dead session.
  // getSession() refreshes proactively, but a background refresh can lag or
  // briefly fail. Force one refresh and retry before treating the session as
  // gone. Requests with a caller-supplied token are left as-is.
  if (res.status === 401 && !callerSetAuth) {
    const newAccess = await refreshBrowserSession();
    if (newAccess) {
      headers.set("Authorization", `Bearer ${newAccess}`);
      res = await fetch(input, {
        ...init,
        headers,
        cache: init.cache ?? "no-store",
      });
    }
  }

  if (res.status === 401) report401();
  return res;
}
