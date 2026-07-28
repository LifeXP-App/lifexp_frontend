import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";
import { getAuthCookieOptions } from "@/src/lib/auth/sessionCookies";

const projectRef = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname.split(".")[0];
  } catch {
    return "";
  }
})();

function removeDuplicateAuthCookies(response: NextResponse) {
  response.cookies.delete("access");
  response.cookies.delete("refresh");

  if (projectRef) {
    const legacySsrCookie = `sb-${projectRef}-auth-token`;
    response.cookies.delete(legacySsrCookie);
    for (let index = 0; index < 6; index += 1) {
      response.cookies.delete(`${legacySsrCookie}.${index}`);
    }
  }

  return response;
}

async function getAccountCreatedAt(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) return null;

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const account = (await response.json()) as { created_at?: unknown };
    return typeof account.created_at === "string" ? account.created_at : null;
  } catch {
    return null;
  }
}

function withAccountCreatedAt(data: unknown, createdAt: string | null) {
  if (!data || typeof data !== "object" || Array.isArray(data) || !createdAt) {
    return data;
  }

  return { ...(data as Record<string, unknown>), created_at: createdAt };
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const cookieStore = await cookies();
  const access = cookieStore.get("sb-access-token")?.value;

  if (!access) {
    return removeDuplicateAuthCookies(
      NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
    );
  }

  // 1) try access token
  let res = await fetch(`${baseUrl}/api/v1/auth/me/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });

  // 2) if expired -> shared refresh -> retry once
  if (res.status === 401) {
    const tokens = await sharedRefresh(refreshTokens);

    if (!tokens?.access) {
      const out = NextResponse.json({ detail: "Session expired" }, { status: 401 });
      out.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
      out.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });
      return removeDuplicateAuthCookies(out);
    }

    res = await fetch(`${baseUrl}/api/v1/auth/me/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokens.access}` },
      cache: "no-store",
    });

    const data = await res.json();
    const createdAt = await getAccountCreatedAt(tokens.access);
    const out = NextResponse.json(withAccountCreatedAt(data, createdAt), {
      status: res.status,
    });

    const cookieOptions = getAuthCookieOptions();
    out.cookies.set("sb-access-token", tokens.access, cookieOptions);

    if (tokens.refresh) {
      out.cookies.set("sb-refresh-token", tokens.refresh, cookieOptions);
    }

    return removeDuplicateAuthCookies(out);
  }

  const data = await res.json();
  const createdAt = await getAccountCreatedAt(access);
  return removeDuplicateAuthCookies(
    NextResponse.json(withAccountCreatedAt(data, createdAt), {
      status: res.status,
    })
  );
}
