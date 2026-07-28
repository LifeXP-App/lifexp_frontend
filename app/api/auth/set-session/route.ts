import { NextResponse } from "next/server";
import { getAuthCookieOptions } from "@/src/lib/auth/sessionCookies";

/**
 * Persists a Supabase session (obtained client-side, e.g. after an OAuth
 * code exchange) into httpOnly cookies so server-side route handlers
 * (which can't read localStorage) can authenticate outbound requests to Django.
 */
export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json();

  if (!access_token) {
    return NextResponse.json({ error: "access_token required" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });

  const cookieOptions = getAuthCookieOptions();

  response.cookies.set("sb-access-token", access_token, cookieOptions);

  if (refresh_token) {
    response.cookies.set("sb-refresh-token", refresh_token, cookieOptions);
  }

  return response;
}
