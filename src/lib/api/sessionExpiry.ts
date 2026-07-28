import { supabase } from "@/src/lib/supabase";

/**
 * Global dead-session watchdog.
 *
 * Every shared fetch helper already forces one token refresh and retries
 * before calling report401() — the same-origin /api/* proxies refresh
 * server-side, and the direct-to-Django helpers (authedFetch, goalsFetch)
 * refresh via refreshBrowserSession(). So a 401 that reaches this function has
 * already survived a refresh-and-retry, meaning the session is very likely
 * genuinely unrecoverable (revoked, user deleted, signing key rotated, ...).
 * Without this, a dead session leaves the app stuck on skeletons instead of
 * returning the user to the login page.
 *
 * Once THRESHOLD post-retry 401s land within WINDOW_MS, both session stores
 * are cleared and the browser hard-navigates to the login page. The threshold
 * still absorbs a lone straggler (e.g. one request that lost the refresh race)
 * so a recoverable blip never logs the user out.
 */

const WINDOW_MS = 30_000;
const THRESHOLD = 2;

let recent401s: number[] = [];
let loggingOut = false;

export function report401(): void {
  if (typeof window === "undefined") return;

  // Never redirect away from the auth pages themselves.
  const path = window.location.pathname;
  if (path.startsWith("/users/login") || path.startsWith("/users/register")) {
    return;
  }

  const now = Date.now();
  recent401s = recent401s.filter((t) => now - t < WINDOW_MS);
  recent401s.push(now);

  if (recent401s.length >= THRESHOLD) {
    void forceLogout();
  }
}

export async function forceLogout(): Promise<void> {
  if (loggingOut) return;
  loggingOut = true;

  try {
    // Clears localStorage session + sb cookies via the SDK.
    await supabase.auth.signOut();
  } catch {
    // Even if sign-out fails (e.g. auth server unreachable), still redirect —
    // the session is unusable either way.
  }

  try {
    // The SDK's signOut only clears the localStorage session (and cookies it
    // manages). The httpOnly sb-access-token / sb-refresh-token cookies are
    // set server-side and survive otherwise, so /api/auth/me would keep
    // reporting the user as authenticated and the login page would bounce them
    // straight back — "logged out but no login screen". Clear them too.
    await fetch("/api/auth/logout-supabase", { method: "POST", cache: "no-store" });
  } catch {
    // Redirect regardless — the cookies will also be cleared on the next
    // /api/auth/me 401 path.
  }

  window.location.replace("/users/login");
}
