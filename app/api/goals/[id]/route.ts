import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";

async function authedFetch(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  let access = cookieStore.get("access")?.value;

  if (!access) {
    return NextResponse.json(
      { detail: "Not authenticated" },
      { status: 401 }
    );
  }

  let res = await fetch(url, {
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
    return NextResponse.json(
      { detail: "Session expired" },
      { status: 401 }
    );
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

/* ---------------- DELETE GOAL ---------------- */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await authedFetch(`${baseUrl}/api/v1/goals/${id}/`, {
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
