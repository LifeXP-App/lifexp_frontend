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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("include_archived");
  const page = searchParams.get("page");
  const pageSize = searchParams.get("page_size");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const params = new URLSearchParams();

  if (includeArchived) {
    params.set("include_archived", includeArchived);
  }
  if (page) {
    params.set("page", page);
  }
  if (pageSize) {
    params.set("page_size", pageSize);
  }

  const query = params.toString();
  const url = `${baseUrl}/api/v1/habits/${query ? `?${query}` : ""}`;

  const res = await authedFetch(req, url);

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
