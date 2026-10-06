import { sharedRefresh } from "@/src/lib/auth/refreshLock";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { getAuthToken } from "@/src/lib/auth/getAuthToken";
import { NextResponse } from "next/server";

async function authedFetch(req: Request, url: string, options: RequestInit = {}) {
  let access = await getAuthToken(req);

  if (!access) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

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

  access = tokens.access;

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

export async function GET(
  req: Request,
  context: { params: Promise<{ uid: string }> },
) {
  const { uid } = await context.params;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(req, `${baseUrl}/api/v1/activities/${uid}/habit/`);

  if (res instanceof NextResponse) {
    return res;
  }

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: text }, { status: res.status });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ uid: string }> },
) {
  const { uid } = await context.params;

  // category_id is optional -- the backend falls back to the player's
  // default category when it's omitted, so a missing/empty body is fine.
  let categoryId: unknown;
  try {
    const body = await req.json();
    categoryId = body?.category_id;
  } catch {
    categoryId = undefined;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(req, `${baseUrl}/api/v1/activities/${uid}/habit/`, {
    method: "POST",
    body: categoryId ? JSON.stringify({ category_id: categoryId }) : undefined,
  });

  if (res instanceof NextResponse) {
    return res;
  }

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: text }, { status: res.status });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ uid: string }> },
) {
  const { uid } = await context.params;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(req, `${baseUrl}/api/v1/activities/${uid}/habit/`, {
    method: "DELETE",
  });

  if (res instanceof NextResponse) {
    return res;
  }

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: text }, { status: res.status });
  }
}
