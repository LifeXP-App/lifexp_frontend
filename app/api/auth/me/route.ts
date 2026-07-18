import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";

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
    const out = NextResponse.json(data, { status: res.status });

    out.cookies.set("sb-access-token", tokens.access, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    if (tokens.refresh) {
      out.cookies.set("sb-refresh-token", tokens.refresh, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return removeDuplicateAuthCookies(out);
  }

  const data = await res.json();
  return removeDuplicateAuthCookies(
    NextResponse.json(data, { status: res.status })
  );
}
