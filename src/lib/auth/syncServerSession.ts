import type { Session } from "@supabase/supabase-js";

/**
 * Copy a Supabase session into the httpOnly `sb-access-token` /
 * `sb-refresh-token` cookies that the `/api/*` route handlers read.
 *
 * The browser SDK is the single owner of the refresh token (see
 * `refreshBrowserSession`). The server never rotates it, so these cookies are
 * only ever a mirror of whatever generation the SDK currently holds. Every
 * place that obtains a new session — sign-in, the OAuth callback, a token
 * refresh — must call this so the next server-side request authenticates with
 * the same generation.
 */
export async function syncServerSession(session: {
  access_token: string;
  refresh_token?: string | null;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/set-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token ?? undefined,
      }),
      cache: "no-store",
    });

    return res.ok;
  } catch (err) {
    console.error("Failed to sync server auth session:", err);
    return false;
  }
}

export type { Session };
