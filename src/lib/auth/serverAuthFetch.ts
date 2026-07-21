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

  // 2) if expired -> refresh once (deduplicated) -> retry.
  //
  // refreshTokens() reads sb-refresh-token, refreshes against Supabase, and
  // writes the rotated sb-access-token / sb-refresh-token cookies. Earlier this
  // fetched a relative "/api/auth/refresh" (which never resolves server-side)
  // and then read a nonexistent "access" cookie, so the retry never fired.
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
