import { NextResponse } from "next/server";
import { getAuthToken } from "@/src/lib/auth/getAuthToken";
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

export async function GET(request: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!baseUrl) {
      return NextResponse.json(
        { detail: "NEXT_PUBLIC_API_BASE_URL missing" },
        { status: 500 }
      );
    }

    let access = await getAuthToken(request);

    if (!access) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 }
      );
    }

    const target = `${baseUrl}/api/v1/goals/interactions/recent/`;

    let res = await fetch(target, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
      },
      cache: "no-store",
    });

    if (res.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);

      if (!tokens?.access) {
        const out = NextResponse.json(
          { detail: "Session expired" },
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
        },
        cache: "no-store",
      });
    }

    const data = await safeJson(res);

    return NextResponse.json(data, {
      status: res.status,
    });

  } catch (err: unknown) {
    return NextResponse.json(
      {
        detail: "Failed to load interactions",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
