// Supabase sessions are rolling and indefinite by default. Keep the browser
// cookies far in the future and refresh their lifetime whenever tokens rotate;
// Supabase remains the authority that decides whether a session is valid.
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 10;

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  };
}
