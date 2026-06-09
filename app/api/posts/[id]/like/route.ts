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
  const cookieStore = await cookies();
  let access = cookieStore.get("access")?.value;

  if (!access) {
    return NextResponse.json(
      { detail: "Not authenticated" },
      { status: 401 }
    );
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
    return NextResponse.json(
      { detail: "Session expired" },
      { status: 401 }
    );
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

/* ---------------- GET LIKE STATUS ---------------- */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Validate ID is a positive integer
  const postId = parseInt(id, 10);
  if (isNaN(postId) || postId <= 0) {
    return NextResponse.json(
      { detail: "Invalid post ID" },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(`${baseUrl}/api/v1/posts/${postId}/like/`);

  // If authedFetch returned a NextResponse (auth error), return it directly
  if (res instanceof NextResponse) {
    return res;
  }

  return NextResponse.json(await safeJson(res), { status: res.status });
}

/* ---------------- TOGGLE LIKE (POST) ---------------- */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Validate ID is a positive integer
  const postId = parseInt(id, 10);
  if (isNaN(postId) || postId <= 0) {
    return NextResponse.json(
      { detail: "Invalid post ID" },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(`${baseUrl}/api/v1/posts/${postId}/like/`, {
    method: "POST",
  });

  // If authedFetch returned a NextResponse (auth error), return it directly
  if (res instanceof NextResponse) {
    return res;
  }

  return NextResponse.json(await safeJson(res), { status: res.status });
}
