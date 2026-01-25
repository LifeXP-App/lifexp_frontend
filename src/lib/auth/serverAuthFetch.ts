import { cookies } from "next/headers";

export async function serverAuthFetch(url: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const access = cookieStore.get("access")?.value;

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

  // 2) if expired -> refresh once -> retry
  if (res.status === 401) {
    const refreshRes = await fetch("http://localhost:3000/api/auth/refresh", {
      method: "POST",
      cache: "no-store",
    });

    if (!refreshRes.ok) {
      return res; // still unauthorized
    }

    // cookies() now should contain updated access
    const updatedStore = await cookies();
    const newAccess = updatedStore.get("access")?.value;

    if (!newAccess) return res;

    res = await fetch(url, {
      ...(init || {}),
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${newAccess}`,
      },
      cache: "no-store",
    });
  }

  return res;
}
