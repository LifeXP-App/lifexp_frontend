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

async function refreshAccess() {
  // shared refresh route
  return fetch("http://localhost:3000/api/auth/refresh", {
    method: "POST",
    cache: "no-store",
  });
}

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { detail: "NEXT_PUBLIC_API_BASE_URL missing" },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    let access = cookieStore.get("access")?.value;

    if (!access) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    // ✅ 1) get logged-in user first (needs auth)
    let meRes = await fetch(`${baseUrl}/api/v1/auth/me/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    if (meRes.status === 401) {
      const refreshRes = await refreshAccess();
      if (!refreshRes.ok) {
        const out = NextResponse.json({ detail: "Session expired" }, { status: 401 });
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      const updatedStore = await cookies();
      access = updatedStore.get("access")?.value;

      if (!access) {
        const out = NextResponse.json({ detail: "Session expired" }, { status: 401 });
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      meRes = await fetch(`${baseUrl}/api/v1/auth/me/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    }

    const me = await safeJson(meRes);

    if (!meRes.ok) {
      return NextResponse.json(me, { status: meRes.status });
    }

    const id = me?.id;
    if (!id) {
      return NextResponse.json({ detail: "Missing user id" }, { status: 500 });
    }

    // ✅ 2) fetch settings
    let settingsRes = await fetch(`${baseUrl}/api/v1/users/${id}/settings/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    // if expired between calls -> refresh once -> retry
    if (settingsRes.status === 401) {
      const refreshRes = await refreshAccess();
      if (!refreshRes.ok) {
        const out = NextResponse.json({ detail: "Session expired" }, { status: 401 });
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      const updatedStore = await cookies();
      access = updatedStore.get("access")?.value;

      if (!access) {
        const out = NextResponse.json({ detail: "Session expired" }, { status: 401 });
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      settingsRes = await fetch(`${baseUrl}/api/v1/users/${id}/settings/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    }

    const settings = await safeJson(settingsRes);
    return NextResponse.json(settings, { status: settingsRes.status });
  } catch (err: any) {
    return NextResponse.json(
      { detail: "Failed to load settings", error: String(err?.message || err) },
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

    const cookieStore = await cookies();
    let access = cookieStore.get("access")?.value;

    if (!access) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    // ✅ get current user id
    let meRes = await fetch(`${baseUrl}/api/v1/auth/me/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    if (meRes.status === 401) {
      const refreshRes = await refreshAccess();
      if (!refreshRes.ok) {
        const out = NextResponse.json({ detail: "Session expired" }, { status: 401 });
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      const updatedStore = await cookies();
      access = updatedStore.get("access")?.value;

      if (!access) {
        const out = NextResponse.json({ detail: "Session expired" }, { status: 401 });
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      meRes = await fetch(`${baseUrl}/api/v1/auth/me/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    }

    const me = await safeJson(meRes);

    if (!meRes.ok) {
      return NextResponse.json(me, { status: meRes.status });
    }

    const id = me?.id;
    if (!id) {
      return NextResponse.json({ detail: "Missing user id" }, { status: 500 });
    }

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
      const refreshRes = await refreshAccess();
      if (!refreshRes.ok) {
        const out = NextResponse.json({ detail: "Session expired" }, { status: 401 });
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      const updatedStore = await cookies();
      access = updatedStore.get("access")?.value;

      if (!access) {
        const out = NextResponse.json({ detail: "Session expired" }, { status: 401 });
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

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
  } catch (err: any) {
    return NextResponse.json(
      { detail: "Failed to update settings", error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
