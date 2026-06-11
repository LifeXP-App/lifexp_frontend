import { sharedRefresh } from "@/src/lib/auth/refreshLock";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { getAuthToken } from "@/src/lib/auth/getAuthToken";
import { NextResponse } from "next/server";
import { getPostHogClient } from "@/src/lib/posthog-server";

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = searchParams.get("page");
  const pageSize = searchParams.get("page_size");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }
  if (page) {
    params.set("page", page);
  }
  if (pageSize) {
    params.set("page_size", pageSize);
  }

  const query = params.toString();
  const url = `${baseUrl}/api/v1/goals/${query ? `?${query}` : ""}`;

  const res = await authedFetch(req, url);

  // If authedFetch returned a NextResponse (auth error), return it directly
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

export async function POST(req: Request) {
  const body = await req.json();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(req, `${baseUrl}/api/v1/goals/`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (res instanceof NextResponse) {
    return res;
  }

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (res.ok) {
      const distinctId = data?.user?.username ?? data?.uid ?? "unknown";
      getPostHogClient().capture({
        distinctId,
        event: "goal_created_server",
        properties: {
          goal_id: data?.uid ?? data?.id,
          goal_title: data?.title,
          status: data?.status,
        },
      });
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: text }, { status: res.status });
  }
}
