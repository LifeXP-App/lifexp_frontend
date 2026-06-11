import { NextResponse } from "next/server";
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

async function authedFetch(url: string, options: RequestInit = {}) {
  // ✅ cookies() IS ASYNC
  const cookieStore = await cookies();
  let access = cookieStore.get("access")?.value;

  if (!access) {
    return new Response("Not authenticated", { status: 401 });
  }

  let res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (res.status !== 401) return res;

  // 🔄 refresh
  const tokens = await sharedRefresh(refreshTokens);
  if (!tokens?.access) {
    return new Response("SESSION_EXPIRED", { status: 401 });
  }

  access = tokens.access;

  // retry with new access
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

/* ---------------- GET COMMENTS ---------------- */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(
    `${baseUrl}/api/v1/posts/${id}/comments/`
  );

  return NextResponse.json(await safeJson(res), { status: res.status });
}

/* ---------------- POST COMMENT ---------------- */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(
    `${baseUrl}/api/v1/posts/${id}/comments/`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return NextResponse.json(await safeJson(res), { status: res.status });
}
