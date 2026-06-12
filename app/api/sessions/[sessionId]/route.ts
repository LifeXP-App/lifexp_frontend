import { sharedRefresh } from "@/src/lib/auth/refreshLock";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPostHogClient } from "@/src/lib/posthog-server";

async function authedFetch(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  let access = cookieStore.get("sb-access-token")?.value;

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

// Fetch a single session (requires GET /api/v1/sessions/{session_id}/ on Django)
export async function GET(
  _req: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const res = await authedFetch(`${baseUrl}/api/v1/sessions/${sessionId}/`);

  if (res instanceof NextResponse) return res;

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: text }, { status: res.status });
  }
}

// Complete or update a session
export async function PUT(
  req: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const body = await req.json();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const res = await authedFetch(`${baseUrl}/api/v1/sessions/${sessionId}/`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (res instanceof NextResponse) return res;

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (res.ok && body?.status === "completed") {
      const distinctId = data?.user?.username ?? data?.user ?? "unknown";
      getPostHogClient().capture({
        distinctId,
        event: "session_synced_server",
        properties: {
          session_id: sessionId,
          goal_id: data?.goal ?? body?.goal,
          xp_total: body?.xp_total,
          duration_seconds: body?.total_duration_seconds,
          focused_seconds: body?.focused_duration_seconds,
        },
      });
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: text }, { status: res.status });
  }
}
