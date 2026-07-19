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
    },
    cache: "no-store",
  });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const formData = await req.formData();

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(
    req,
    `${baseUrl}/api/v1/goals/${id}/complete/`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (res instanceof NextResponse) return res;

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: text }, { status: res.status });
  }
}
