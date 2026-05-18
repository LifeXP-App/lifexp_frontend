import { sharedRefresh } from "@/src/lib/auth/refreshLock";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function authedFetch(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  let access = cookieStore.get("access")?.value;

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

export async function POST(req: Request) {
  const body = await req.json();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

  // Fetch XP rates
  const ratesRes = await authedFetch(
    `${baseUrl}/api/v1/sessions/calculate-rates/`,
    { method: "POST", body: JSON.stringify(body) },
  );

  if (ratesRes instanceof NextResponse) return ratesRes;

  const ratesText = await ratesRes.text();
  let ratesData;
  try {
    ratesData = JSON.parse(ratesText);
  } catch {
    return NextResponse.json({ detail: ratesText }, { status: ratesRes.status });
  }

  return NextResponse.json(ratesData, { status: ratesRes.status });
}
