import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";

// Valid mastery types
const VALID_MASTERY_TYPES = [
  "warrior",
  "protagonist",
  "diplomat",
  "alchemist",
  "prodigy",
  "rookie",
];

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

interface Context {
  params: Promise<{ masteryType: string }>;
}

export async function GET(request: Request, context: Context) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { detail: "NEXT_PUBLIC_API_BASE_URL missing" },
        { status: 500 }
      );
    }

    const { masteryType } = await context.params;

    // Validate mastery type
    if (!VALID_MASTERY_TYPES.includes(masteryType)) {
      return NextResponse.json(
        { detail: `Invalid mastery type: ${masteryType}` },
        { status: 400 }
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

    // Parse URL search params
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const search = searchParams.get("search") || "";
    const friends = searchParams.get("friends") || "all";
    const xptype = searchParams.get("xptype") || "";

    // Build query string
    const queryParams = new URLSearchParams({
      page,
      ...(search && { search }),
      friends,
      ...(xptype && { xptype }),
    });

    // Build backend URL - use new DRF JWT endpoint
    const target = `${baseUrl}/api/v1/xp/leaderboard/mastery/${masteryType}/?${queryParams.toString()}`;

    // 1) Try current access token with JWT Bearer authentication
    let res = await fetch(target, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    // 2) If expired -> shared refresh -> retry once
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
          "Authorization": `Bearer ${access}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      const data = await safeJson(res);
      const out = NextResponse.json(data, { status: res.status });

      // Update access cookie
      out.cookies.set("access", tokens.access, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      // Rotate refresh if returned
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
        detail: "Failed to fetch mastery leaderboard",
        error: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
