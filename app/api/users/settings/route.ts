import { NextResponse } from "next/server";
import { getAuthToken } from "@/src/lib/auth/getAuthToken";
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

async function clearSessionResponse(detail = "Session expired") {
  const out = NextResponse.json({ detail }, { status: 401 });
  out.cookies.set("access", "", { path: "/", maxAge: 0 });
  out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
  return out;
}

async function getCurrentUserId(baseUrl: string, access: string) {
  const res = await fetch(`${baseUrl}/api/v1/auth/me/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });
  const data = await safeJson(res);

  if (!res.ok) {
    return { error: NextResponse.json(data, { status: res.status }) };
  }

  const id = data?.id;
  if (!id) {
    return {
      error: NextResponse.json({ detail: "Missing user id" }, { status: 500 }),
    };
  }

  return { id };
}

export async function GET(req: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { detail: "NEXT_PUBLIC_API_BASE_URL missing" },
        { status: 500 }
      );
    }

    let access = await getAuthToken(req);

    if (!access) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    let userResult = await getCurrentUserId(baseUrl, access);
    if (userResult.error?.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);
      if (!tokens?.access) return clearSessionResponse();
      access = tokens.access;
      userResult = await getCurrentUserId(baseUrl, access);
    }
    if (userResult.error) return userResult.error;
    const id = userResult.id;

    // ✅ 2) fetch settings
    let settingsRes = await fetch(`${baseUrl}/api/v1/users/${id}/settings/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    // if expired between calls -> refresh once -> retry
    if (settingsRes.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);
      if (!tokens?.access) return clearSessionResponse();
      access = tokens.access;

      settingsRes = await fetch(`${baseUrl}/api/v1/users/${id}/settings/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    }

    const settings = await safeJson(settingsRes);
    return NextResponse.json(settings, { status: settingsRes.status });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        detail: "Failed to load settings",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { detail: "NEXT_PUBLIC_API_BASE_URL missing" },
        { status: 500 }
      );
    }

    const payload = await req.json();

    let access = await getAuthToken(req);

    if (!access) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    let userResult = await getCurrentUserId(baseUrl, access);
    if (userResult.error?.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);
      if (!tokens?.access) return clearSessionResponse();
      access = tokens.access;
      userResult = await getCurrentUserId(baseUrl, access);
    }
    if (userResult.error) return userResult.error;
    const id = userResult.id;

    // ✅ PATCH settings
    let settingsRes = await fetch(`${baseUrl}/api/v1/users/${id}/settings/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (settingsRes.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);
      if (!tokens?.access) return clearSessionResponse();
      access = tokens.access;

      settingsRes = await fetch(`${baseUrl}/api/v1/users/${id}/settings/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
    }

    const data = await safeJson(settingsRes);
    return NextResponse.json(data, { status: settingsRes.status });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        detail: "Failed to update settings",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
