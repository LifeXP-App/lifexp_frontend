import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthCookieOptions } from "@/src/lib/auth/sessionCookies";

/**
 * Refresh Supabase session and get new access token
 */
export async function POST() {
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

    const cookieOptions = getAuthCookieOptions();
    response.cookies.set("sb-access-token", session.access_token, cookieOptions);

    if (session.refresh_token) {
      response.cookies.set("sb-refresh-token", session.refresh_token, cookieOptions);
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
