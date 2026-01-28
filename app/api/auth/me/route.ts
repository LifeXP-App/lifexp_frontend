import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const cookieStore = await cookies();
  let access = cookieStore.get("access")?.value;

  if (!access) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  // 1) try access token
  let res = await fetch(`${baseUrl}/api/v1/auth/me/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });

  // 2) if expired -> shared refresh -> retry once
  if (res.status === 401) {
    const tokens = await sharedRefresh(refreshTokens);

    if (!tokens?.access) {
      const out = NextResponse.json({ detail: "Session expired" }, { status: 401 });
      out.cookies.set("access", "", { path: "/", maxAge: 0 });
      out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
      return out;
    }

    res = await fetch(`${baseUrl}/api/v1/auth/me/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokens.access}` },
      cache: "no-store",
    });

    const data = await res.json();
    const out = NextResponse.json(data, { status: res.status });

    out.cookies.set("access", tokens.access, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    if (tokens.refresh) {
      out.cookies.set("refresh", tokens.refresh, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return out;
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
