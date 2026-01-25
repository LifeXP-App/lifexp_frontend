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

export async function GET(req: Request) {
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
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    // ✅ forward query params (limit etc.)
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "5";

    // ✅ Django endpoints should use trailing slash
    const target = `${baseUrl}/api/v1/discover/users/?limit=${limit}`;

    // 1) try with current access
    let res = await fetch(target, {
      method: "GET",
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    // 2) if expired -> call shared refresh route -> retry once
    if (res.status === 401) {
      const refreshRes = await fetch("http://localhost:3000/api/auth/refresh", {
        method: "POST",
        cache: "no-store",
      });

      if (!refreshRes.ok) {
        // refresh failed -> session dead
        const out = NextResponse.json(
          { detail: "SESSION_EXPIRED" },
          { status: 401 }
        );
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      // ✅ read updated access after refresh
      const updatedStore = await cookies();
      access = updatedStore.get("access")?.value;

      if (!access) {
        const out = NextResponse.json(
          { detail: "SESSION_EXPIRED" },
          { status: 401 }
        );
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      // retry with new access
      res = await fetch(target, {
        method: "GET",
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    }

    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      {
        detail: "Failed to fetch discover users",
        error: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
