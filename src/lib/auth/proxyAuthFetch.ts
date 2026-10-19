import { NextResponse } from "next/server";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { getAuthToken } from "@/src/lib/auth/getAuthToken";

/**
 * Route-handler helper: forwards a request to Django with the user's bearer
 * token, retrying once after a refresh on 401. Returns a NextResponse when
 * the user isn't authenticated at all. Callers set their own Content-Type
 * (leave it off for FormData so fetch adds the multipart boundary).
 */
export async function proxyAuthFetch(
  req: Request,
  url: string,
  options: RequestInit = {},
): Promise<Response | NextResponse> {
  const access = await getAuthToken(req);
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const send = (token: string) =>
    fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

  const res = await send(access);
  if (res.status !== 401) return res;

  const tokens = await sharedRefresh(refreshTokens);
  if (!tokens?.access) {
    return NextResponse.json({ detail: "Session expired" }, { status: 401 });
  }
  return send(tokens.access);
}

/** Pass Django's JSON (or plain-text / empty) response through as-is. */
export async function passThrough(res: Response | NextResponse): Promise<NextResponse> {
  if (res instanceof NextResponse) return res;
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ detail: text }, { status: res.status });
  }
}
