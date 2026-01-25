import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { detail: "NEXT_PUBLIC_API_BASE_URL missing" },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const refresh = cookieStore.get("refresh")?.value;

  if (!refresh) {
    return NextResponse.json({ detail: "No refresh token" }, { status: 401 });
  }

  const res = await fetch(`${baseUrl}/api/v1/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  const data = await safeJson(res);

  if (!res.ok) {
    const out = NextResponse.json(data, { status: res.status });

    // ✅ clear cookies if refresh fails
    out.cookies.set("access", "", { path: "/", maxAge: 0 });
    out.cookies.set("refresh", "", { path: "/", maxAge: 0 });

    return out;
  }

  const out = NextResponse.json({ ok: true }, { status: 200 });

  // ✅ set new access
  out.cookies.set("access", data.access, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });

  // ✅ VERY IMPORTANT: set new refresh if rotation returns it
  if (data.refresh) {
    out.cookies.set("refresh", data.refresh, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
  }

  return out;
}
