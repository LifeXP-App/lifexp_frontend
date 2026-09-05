/**
 * Kept for the ~50 route handlers that call `sharedRefresh(refreshTokens)`.
 *
 * This used to memoize the in-flight refresh in a module-level promise. That
 * was shared by every concurrent request on the server, regardless of which
 * user made them, so a second user's refresh could resolve with the first
 * user's tokens. `refreshTokens` no longer touches the network or the refresh
 * token (see its comment), so there is nothing left to deduplicate — and
 * nothing left to leak across users.
 */
export async function sharedRefresh(
  refreshFn: () => Promise<{ access?: string; refresh?: string } | null>
) {
  return refreshFn();
}
