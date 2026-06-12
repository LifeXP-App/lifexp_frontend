import { sharedRefresh } from "@/src/lib/auth/refreshLock";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { getAuthToken } from "@/src/lib/auth/getAuthToken";
import { NextResponse } from "next/server";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ uid: string }> }
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { detail: "NEXT_PUBLIC_API_BASE_URL missing" },
        { status: 500 }
      );
    }

    const { uid } = await context.params;

    let access = await getAuthToken(req);

    if (!access) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 }
      );
    }

    const target = `${baseUrl}/api/v1/activities/${uid}/leaderboard/`;

    let res = await fetch(target, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
      },
      cache: "no-store",
    });

    let refreshed = false;
    let refreshedTokens: { access: string; refresh?: string } | null = null;

    // 🔁 refresh flow
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
        refreshedTokens = tokens as { access: string; refresh?: string };
      refreshed = true;

      res = await fetch(target, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access}`,
        },
        cache: "no-store",
      });
    }

    const data = await safeJson(res);
    const out = NextResponse.json(data, { status: res.status });

    if (refreshed) {
      out.cookies.set("access", access, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      if (refreshedTokens?.refresh) {
        out.cookies.set("refresh", refreshedTokens.refresh, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
        });
      }
    }

    return out;

  } catch (err: unknown) {
    return NextResponse.json(
      {
        detail: "Failed to load leaderboard",
        error: String(err instanceof Error ? err.message : err),
      },
      { status: 500 }
    );
  }
}