import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAuthCookieOptions } from "@/src/lib/auth/sessionCookies";

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

    let supabase;
    try {
      supabase = await createSupabaseServerClient();
    } catch (clientErr) {
      console.error("[DEBUG login/supabase] createSupabaseServerClient threw:", clientErr);
      throw clientErr;
    }

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
    const targetUrl = `${baseUrl}/api/v1/auth/me/`;

    let djangoRes: Response;
    try {
      djangoRes = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
    } catch (fetchErr) {
      console.error("[/api/auth/login/supabase] fetch to Django threw:", fetchErr);
      return NextResponse.json(
        { error: "fetch to Django threw", debugFetchError: String(fetchErr) },
        { status: 502 }
      );
    }

    // Read the body exactly once as text, then reuse it for both logging
    // and JSON parsing below — calling .json() a second time on the same
    // Response would throw "body already read".
    const bodyText = await djangoRes.text();

    if (!djangoRes.ok) {
      // TEMP: surface Django's actual response instead of a generic message
      // so we can see the real cause instead of guessing.
      return NextResponse.json(
        {
          error: "Failed to fetch user from Django",
          djangoStatus: djangoRes.status,
          djangoBody: bodyText,
        },
        { status: djangoRes.status }
      );
    }

    let userData;
    try {
      userData = JSON.parse(bodyText);
    } catch (parseErr) {
      console.error("[/api/auth/login/supabase] Django response was not valid JSON:", parseErr);
      return NextResponse.json(
        { error: "Django response was not valid JSON", djangoBody: bodyText },
        { status: 502 }
      );
    }

    // Success - set Supabase session in secure httpOnly cookie
    const response = NextResponse.json({
      ok: true,
      user: userData,
    });

    // Store the Supabase JWT in httpOnly cookie (similar to Django pattern)
    const cookieOptions = getAuthCookieOptions();
    response.cookies.set("sb-access-token", accessToken, cookieOptions);

    // Also store refresh token
    if (session.refresh_token) {
      response.cookies.set("sb-refresh-token", session.refresh_token, cookieOptions);
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
