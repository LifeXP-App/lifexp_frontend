import { NextResponse } from "next/server";

/**
 * Clear the server's mirror of the Supabase session.
 *
 * The browser SDK owns the session itself; callers run
 * `supabase.auth.signOut()` (which revokes it with Supabase and clears
 * localStorage) and then hit this route to drop the httpOnly cookies. Without
 * that second step /api/auth/me keeps reporting the user as authenticated and
 * the login page bounces them straight back in.
 *
 * This used to build a Supabase server client and call signOut() on it. That
 * client is created with `persistSession: false`, so it never held a session to
 * sign out of — the call was a no-op round trip to the auth server.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
  response.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });

  return response;
}
