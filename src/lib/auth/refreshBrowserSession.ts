import { supabase } from "@/src/lib/supabase";

let inFlight: Promise<string | null> | null = null;

/**
 * Force a single Supabase token refresh on the browser SDK session,
 * deduplicated across concurrent callers.
 *
 * A page usually fires several API calls at once. When the access token has
 * just expired they would each independently try to refresh, racing on the
 * (rotating) refresh token. Single-flighting means one refresh runs and every
 * caller awaits the same result.
 *
 * Returns the new access token, or null when the session is genuinely
 * unrecoverable (missing/invalid refresh token, auth server unreachable).
 */
export async function refreshBrowserSession(): Promise<string | null> {
  if (!inFlight) {
    inFlight = (async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) return null;
        return data.session.access_token ?? null;
      } catch {
        return null;
      } finally {
        inFlight = null;
      }
    })();
  }
  return inFlight;
}
