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

export async function GET(req: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!baseUrl) {
      return NextResponse.json(
        { detail: "NEXT_PUBLIC_API_BASE_URL is missing" },
        { status: 500 }
      );
    }

    let access = await getAuthToken(req);

    if (!access) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    // ✅ allow query params (unread=true etc.)
    const { searchParams } = new URL(req.url);
    const unread = searchParams.get("unread") || "true";
    const limit = searchParams.get("limit");
    const page = searchParams.get("page");

    const params = new URLSearchParams({ unread });
    if (limit) params.set("limit", limit);
    if (page) params.set("page", page);

    // ✅ Django best practice = trailing slash
    const target = `${baseUrl}/api/v1/notifications/?${params.toString()}`;

    // 1) try request with current access
    let res = await fetch(target, {
      method: "GET",
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    // 2) if expired -> shared refresh -> retry once
    //
    // This used to POST to a hardcoded "http://localhost:3000/api/auth/refresh"
    // (the legacy Django refresh route, which writes the old `access`/`refresh`
    // cookies) and then read a nonexistent `access` cookie. In any deployment
    // that is not a dev box on port 3000 the fetch failed outright, so
    // notifications answered 401 forever once the access token expired.
    if (res.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);

      if (!tokens?.access) {
        // Stale mirrored access token, not a dead session — leave the cookies
        // alone and let the client refresh through the Supabase SDK and retry.
        return NextResponse.json(
          { detail: "Session expired", code: "TOKEN_EXPIRED" },
          { status: 401 }
        );
      }

      access = tokens.access;

      // retry request
      res = await fetch(target, {
        method: "GET",
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    }

    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      {
        detail: "Route crashed",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
