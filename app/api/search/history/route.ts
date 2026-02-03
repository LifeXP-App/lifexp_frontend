import { NextResponse, NextRequest } from "next/server";
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

// GET - Get search history
export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const cookieStore = await cookies();
    let access = cookieStore.get("access")?.value;

    if (!access) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "20";
    const type = searchParams.get("type");

    let target = `${baseUrl}/api/v1/search/history/?limit=${limit}`;
    if (type) {
      target += `&type=${type}`;
    }

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

    return NextResponse.json(await safeJson(res), { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}

// POST - Save search history
export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const cookieStore = await cookies();
    let access = cookieStore.get("access")?.value;

    if (!access) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    const target = `${baseUrl}/api/v1/search/history/`;

    let res = await fetch(target, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (res.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);
      if (!tokens?.access) {
        return NextResponse.json({ detail: "SESSION_EXPIRED" }, { status: 401 });
      }

      access = tokens.access;

      res = await fetch(target, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    }

    return NextResponse.json(await safeJson(res), { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}
