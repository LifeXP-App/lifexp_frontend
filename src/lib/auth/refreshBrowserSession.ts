import { supabase } from "@/src/lib/supabase";
import { syncServerSession } from "@/src/lib/auth/syncServerSession";

let inFlight: Promise<string | null> | null = null;

/**
 * Force a single Supabase token refresh on the browser SDK session,
 * deduplicated across concurrent callers, then mirror the new generation into
 * the httpOnly cookies the server reads.
 *
 * The browser SDK is the ONLY holder that may spend a refresh token. Supabase
 * rotates refresh tokens and revokes the previous one, so a second, independent
 * refresher (the server used to be one) would eventually spend a token the SDK
 * still had stored. The SDK treats "Invalid Refresh Token: Already Used" as
 * non-retryable, drops the session and emits SIGNED_OUT — which is what used to
 * log people out at random, typically the first time a tab woke from sleep.
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

        // The cookies must be on the same generation before the caller retries
        // its request, otherwise the retry re-sends the expired access token.
        await syncServerSession(data.session);

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

/**
 * Make sure the server cookies hold a usable access token.
 *
 * `getSession()` refreshes on its own when the stored token has expired (or is
 * inside the SDK's expiry margin), so this both revives the browser session and
 * mirrors it to the cookies. Cheap to call: when nothing expired it is a
 * localStorage read plus one small POST.
 */
export async function ensureFreshServerSession(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return null;

    await syncServerSession(session);
    return session.access_token;
  } catch {
    return null;
  }
}
