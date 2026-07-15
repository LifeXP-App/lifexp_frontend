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

async function authedFetch(access: string, url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (res.status !== 401) return res;

  const tokens = await sharedRefresh(refreshTokens);
  if (!tokens?.access) {
    return NextResponse.json({ detail: "Session expired" }, { status: 401 });
  }

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${tokens.access}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

/* ---------------- GET LIKE STATUS ---------------- */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const postId = parseInt(id, 10);
  if (isNaN(postId) || postId <= 0) {
    return NextResponse.json({ detail: "Invalid post ID" }, { status: 400 });
  }

  const access = await getAuthToken(req);
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(access, `${baseUrl}/api/v1/posts/${postId}/like/`);

  if (res instanceof NextResponse) return res;
  return NextResponse.json(await safeJson(res), { status: res.status });
}

/* ---------------- TOGGLE LIKE (POST) ---------------- */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const postId = parseInt(id, 10);
  if (isNaN(postId) || postId <= 0) {
    return NextResponse.json({ detail: "Invalid post ID" }, { status: 400 });
  }

  const access = await getAuthToken(req);
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(access, `${baseUrl}/api/v1/posts/${postId}/like/`, {
    method: "POST",
  });

  if (res instanceof NextResponse) return res;
  return NextResponse.json(await safeJson(res), { status: res.status });
}
