import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Login via Supabase + Django integration
 * 1. Authenticate with Supabase
 * 2. Get Supabase JWT
 * 3. Store JWT in httpOnly cookie
 * 4. Fetch user from Django with Supabase JWT
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message || "Authentication failed" },
        { status: 401 }
      );
    }

    const { session } = data;
    const accessToken = session.access_token;

    // Fetch user from Django using Supabase JWT
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const djangoRes = await fetch(`${baseUrl}/api/v1/auth/me/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!djangoRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user from Django" },
        { status: djangoRes.status }
      );
    }

    const userData = await djangoRes.json();

    // Success - set Supabase session in secure httpOnly cookie
    const response = NextResponse.json({
      ok: true,
      user: userData,
    });

    // Store the Supabase JWT in httpOnly cookie (similar to Django pattern)
    response.cookies.set("sb-access-token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // localhost dev
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Also store refresh token
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
    console.error("[/api/auth/login/supabase]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
