/**
 * Server-side token refresh — deliberately a no-op.
 *
 * WHY: Supabase rotates refresh tokens and revokes the previous one. The
 * browser SDK (`src/lib/supabase.ts`, autoRefreshToken + getSession) holds the
 * session in localStorage and refreshes it on its own schedule. When this
 * function also spent the `sb-refresh-token` cookie, whichever side refreshed
 * second presented an already-used token:
 *
 *   - server refreshes first  -> the SDK's stored token is dead -> the SDK
 *     treats the failure as non-retryable, wipes the session and emits
 *     SIGNED_OUT -> AuthGuard force-logs the user out.
 *   - SDK refreshes first     -> the cookie's token is dead -> every proxy
 *     route 401s and /api/auth/me reported the session as expired.
 *
 * Either way the user got signed out for no reason, reliably the first time a
 * tab woke from sleep or sat idle past the access-token lifetime.
 *
 * So there is exactly one owner of the refresh token now: the browser. The
 * server only ever consumes the `sb-access-token` cookie, which the browser
 * mirrors via `/api/auth/set-session` (see `syncServerSession`) on sign-in and
 * on every TOKEN_REFRESHED.
 *
 * Returning null makes every route handler fall through to its existing
 * "session expired -> 401" branch. That 401 is a signal, not a verdict: the
 * client fetch helpers (`authedFetch`, `goalsFetch`, `AuthContext.refreshMe`)
 * refresh through the SDK, re-sync the cookies and retry once. Only if the SDK
 * itself cannot refresh is the session actually gone.
 *
 * Route handlers must NOT clear the auth cookies on this path — the cookies are
 * still the mirror of a live browser session.
 */
export async function refreshTokens(): Promise<{
  access?: string;
  refresh?: string;
} | null> {
  return null;
}
