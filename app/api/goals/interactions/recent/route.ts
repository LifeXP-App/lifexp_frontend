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

    // ✅ MUST await in Next 15
    const cookieStore = await cookies();
    let access = cookieStore.get("access")?.value;

    if (!access) {
      return NextResponse.json(
        { detail: "Not authenticated" },
        { status: 401 }
      );
    }

    const target = `${baseUrl}/api/v1/goals/interactions/recent/`;

    let res = await fetch(target, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
      },
      cache: "no-store",
    });

    if (res.status === 401) {
      const refreshRes = await refreshAccess();

      if (!refreshRes.ok) {
        const out = NextResponse.json(
          { detail: "Session expired" },
          { status: 401 }
        );
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      // ✅ MUST await again
      const updatedStore = await cookies();
      access = updatedStore.get("access")?.value;

      if (!access) {
        const out = NextResponse.json(
          { detail: "Session expired" },
          { status: 401 }
        );
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      res = await fetch(target, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access}`,
        },
        cache: "no-store",
      });
    }

    const data = await safeJson(res);

    return NextResponse.json(data, {
      status: res.status,
    });

  } catch (err: any) {
    return NextResponse.json(
      {
        detail: "Failed to load interactions",
        error: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}