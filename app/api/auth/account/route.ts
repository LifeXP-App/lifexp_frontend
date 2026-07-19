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

  // 🔄 refresh
  const tokens = await sharedRefresh(refreshTokens);
  if (!tokens?.access) {
    return NextResponse.json({ detail: "Session expired" }, { status: 401 });
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

/* ---------------- DELETE ACCOUNT ---------------- */
export async function DELETE(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(req, `${baseUrl}/api/v1/auth/account/`, {
    method: "DELETE",
  });

  // If authedFetch returned a NextResponse (auth error), return it directly
  if (res instanceof NextResponse) {
    return res;
  }

  // For 204 No Content, return empty response
  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  // For other responses (errors), parse and return JSON
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: text }, { status: res.status });
  }
}
