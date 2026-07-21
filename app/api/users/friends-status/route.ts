import { NextResponse } from "next/server";
import { getAuthToken } from "@/src/lib/auth/getAuthToken";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";
import { getAuthCookieOptions } from "@/src/lib/auth/sessionCookies";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

export async function GET(req: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { detail: "NEXT_PUBLIC_API_BASE_URL missing" },
        { status: 500 }
      );
    }

    let access = await getAuthToken(req);

    if (!access) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const target = `${baseUrl}/api/v1/users/friends-status/`;

    // 1) try current access
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
        out.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
        out.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });
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

      const cookieOptions = getAuthCookieOptions();
      out.cookies.set("sb-access-token", tokens.access, cookieOptions);

      if (tokens.refresh) {
        out.cookies.set("sb-refresh-token", tokens.refresh, cookieOptions);
      }

      return out;
    }

    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      {
        detail: "Failed to fetch friends status",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
