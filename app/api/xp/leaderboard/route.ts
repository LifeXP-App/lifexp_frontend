import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { detail: "NEXT_PUBLIC_API_BASE_URL missing" },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    let access = cookieStore.get("access")?.value;

    if (!access) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 }
      );
    }

    const target = `${baseUrl}/api/v1/xp/leaderboard`;

    // 1) try current access token
    let res = await fetch(target, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    // 2) if expired -> shared refresh -> retry once
    if (res.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);

      if (!tokens?.access) {
        const out = NextResponse.json(
          { detail: "SESSION_EXPIRED" },
          { status: 401 }
        );
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      access = tokens.access;

      res = await fetch(target, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });

      const data = await safeJson(res);
      const out = NextResponse.json(data, { status: res.status });

      // update access cookie
      out.cookies.set("access", tokens.access, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      // rotate refresh if returned
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

    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      {
        detail: "Failed to fetch leaderboard",
        error: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
