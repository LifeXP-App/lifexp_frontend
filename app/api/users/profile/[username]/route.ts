import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

function normalizeProfileDates(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const profile = payload as Record<string, unknown>;
  const account =
    profile.user && typeof profile.user === "object" && !Array.isArray(profile.user)
      ? (profile.user as Record<string, unknown>)
      : null;
  const joinedDate =
    profile.joined_date ??
    profile.date_joined ??
    profile.created_at ??
    profile.createdAt ??
    account?.joined_date ??
    account?.date_joined ??
    account?.created_at ??
    account?.createdAt;

  return joinedDate
    ? { ...profile, joined_date: joinedDate }
    : profile;
}

async function authedFetch(url: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const incomingHeaders = new Headers(options.headers);
  const access =
    incomingHeaders.get("Authorization")?.replace("Bearer ", "").trim() ||
    cookieStore.get("sb-access-token")?.value;

  if (!access) {
    return new Response("Not authenticated", { status: 401 });
  }

  incomingHeaders.set("Authorization", `Bearer ${access}`);

  const res = await fetch(url, {
    ...options,
    headers: incomingHeaders,
    cache: "no-store",
  });

  if (res.status !== 401 && res.status !== 403) return res;

  const tokens = await sharedRefresh(refreshTokens);
  if (!tokens?.access) {
    return new Response("SESSION_EXPIRED", { status: 401 });
  }

  incomingHeaders.set("Authorization", `Bearer ${tokens.access}`);

  return fetch(url, {
    ...options,
    headers: incomingHeaders,
    cache: "no-store",
  });
}

export async function GET(
  req: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const res = await authedFetch(`${baseUrl}/api/v1/users/${username}/`, {
    headers: {
      Authorization: req.headers.get("Authorization") ?? "",
      "Content-Type": "application/json",
    },
  });

  const profile = normalizeProfileDates(await safeJson(res));

  return NextResponse.json(profile, {
    status: res.status,
  });
}
