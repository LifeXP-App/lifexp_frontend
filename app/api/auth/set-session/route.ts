import { NextResponse } from "next/server";

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

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };

  response.cookies.set("sb-access-token", access_token, cookieOptions);

  if (refresh_token) {
    response.cookies.set("sb-refresh-token", refresh_token, cookieOptions);
  }

  return response;
}
