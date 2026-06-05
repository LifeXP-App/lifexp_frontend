import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Refresh Supabase session and get new access token
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("sb-refresh-token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token" },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: "Failed to refresh session" },
        { status: 401 }
      );
    }

    const { session } = data;
    const response = NextResponse.json({ ok: true });

    response.cookies.set("sb-access-token", session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    if (session.refresh_token) {
      response.cookies.set("sb-refresh-token", session.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (err) {
    console.error("[/api/auth/refresh-supabase]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
