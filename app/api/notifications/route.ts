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
        { detail: "NEXT_PUBLIC_API_BASE_URL is missing" },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    let access = cookieStore.get("access")?.value;

    if (!access) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    // ✅ allow query params (unread=true etc.)
    const { searchParams } = new URL(req.url);
    const unread = searchParams.get("unread") || "true";

    // ✅ Django best practice = trailing slash
    const target = `${baseUrl}/api/v1/notifications/?unread=${unread}`;

    // 1) try request with current access
    let res = await fetch(target, {
      method: "GET",
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    // 2) if expired -> shared refresh -> retry once
    if (res.status === 401) {
      const refreshRes = await fetch("http://localhost:3000/api/auth/refresh", {
        method: "POST",
        cache: "no-store",
      });

      if (!refreshRes.ok) {
        const out = NextResponse.json(
          { detail: "Session expired" },
          { status: 401 }
        );
        out.cookies.set("access", "", { path: "/", maxAge: 0 });
        out.cookies.set("refresh", "", { path: "/", maxAge: 0 });
        return out;
      }

      // ✅ get fresh access from updated cookies
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

      // retry request
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
        detail: "Route crashed",
        error: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
