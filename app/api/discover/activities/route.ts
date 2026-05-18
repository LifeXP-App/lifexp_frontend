import { getAuthToken } from "@/src/lib/auth/getAuthToken";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { NextResponse } from "next/server";

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
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 },
      );
    }

    const target = `${baseUrl}/api/v1/activities/?page=1&page_size=3`;

    let res = await fetch(target, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    if (res.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);
      if (!tokens?.access) {
        return NextResponse.json(
          { detail: "SESSION_EXPIRED" },
          { status: 401 },
        );
      }

      access = tokens.access;

      res = await fetch(target, {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    }

    return NextResponse.json(await safeJson(res), { status: res.status });
  } catch (e: unknown) {
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}
