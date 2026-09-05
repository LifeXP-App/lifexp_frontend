import { cookies } from "next/headers";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";

export async function serverAuthFetch(url: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const access = cookieStore.get("sb-access-token")?.value;

  if (!access) {
    return new Response(JSON.stringify({ detail: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1) try request
  let res = await fetch(url, {
    ...(init || {}),
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${access}`,
    },
    cache: "no-store",
  });

  // 2) if expired -> ask for a refresh -> retry.
  //
  // refreshTokens() is intentionally a no-op: the browser SDK is the only owner
  // of the refresh token (see src/lib/auth/refreshTokens.ts). So this returns
  // the 401 unchanged and the caller's client-side fetch helper refreshes,
  // re-syncs the cookies and retries.
  if (res.status === 401) {
    const tokens = await sharedRefresh(refreshTokens);
    if (!tokens?.access) {
      return res; // still unauthorized
    }

    res = await fetch(url, {
      ...(init || {}),
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${tokens.access}`,
      },
      cache: "no-store",
    });
  }

  return res;
}
