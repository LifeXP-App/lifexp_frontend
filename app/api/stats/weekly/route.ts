import { NextResponse } from "next/server";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";
import { getAuthToken } from "@/src/lib/auth/getAuthToken";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

async function authedFetch(req: Request, url: string, options: RequestInit = {}) {
  let access = await getAuthToken(req);

  if (!access) {
    return new Response("Not authenticated", { status: 401 });
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${access}`,
    },
    cache: "no-store",
  });

  if (res.status !== 401) return res;

  const tokens = await sharedRefresh(refreshTokens);
  if (!tokens?.access) {
    return new Response("SESSION_EXPIRED", { status: 401 });
  }

  access = tokens.access;

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${access}`,
    },
    cache: "no-store",
  });
}

export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  let url = `${baseUrl}/api/v1/stats/weekly/`;
  if (username) {
    url += `?username=${encodeURIComponent(username)}`;
  }

  const res = await authedFetch(req, url);
  return NextResponse.json(await safeJson(res), { status: res.status });
}
