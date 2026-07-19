import { supabase } from "@/src/lib/supabase";

/**
 * Global dead-session watchdog.
 *
 * The API proxies refresh tokens server-side, so a 401 that reaches browser
 * code means the session is genuinely unrecoverable (revoked, user deleted,
 * signing key rotated, ...). Without this, a dead session leaves the app
 * stuck on skeletons instead of returning the user to the login page.
 *
 * Call report401() from every shared fetch helper whenever a response comes
 * back 401. Once THRESHOLD 401s land within WINDOW_MS, the Supabase session
 * is cleared and the browser hard-navigates to the login page. The threshold
 * keeps a single transient 401 (e.g. a race during token refresh) from
 * logging the user out.
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

  window.location.href = "/users/login";
}
