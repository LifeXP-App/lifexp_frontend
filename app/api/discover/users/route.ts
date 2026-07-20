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
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

    let access = await getAuthToken(request);

    if (!access) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const target = `${baseUrl}/api/v1/discover/users/?limit=5`;

    let res = await fetch(target, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    if (res.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);
      if (!tokens?.access) {
        return NextResponse.json({ detail: "SESSION_EXPIRED" }, { status: 401 });
      }

      access = tokens.access;

      res = await fetch(target, {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    }

    const responseData = await safeJson(res);
    return NextResponse.json(responseData, { status: res.status });
  } catch (e) {
    console.error("Failed to fetch discover users:", e);
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}
