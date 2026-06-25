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

// Register a new session start with Django
export async function POST(req: Request) {
  const body = await req.json();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

<<<<<<< HEAD
  const res = await authedFetch(
    `${baseUrl}/api/v1/sessions/new/`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  console.log("Session POST response:", res);
=======
  const res = await authedFetch(req, `${baseUrl}/api/v1/sessions/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
>>>>>>> 536ba260c015e863b9b84ae5f2ac4c56c3f7fa43

  if (res instanceof NextResponse) return res;

  console.log("status:", res.status);
  console.log("headers:", Object.fromEntries(res.headers.entries()));
  const text = await res.text();
  console.log("body:", text);
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: text }, { status: res.status });
  }
}
