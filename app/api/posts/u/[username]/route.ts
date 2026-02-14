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

export async function GET(
  req: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params; // ✅ FIX
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const cookieStore = await cookies();

    let access = cookieStore.get("access")?.value;

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");

    const target =
      `${baseUrl}/api/v1/posts/${username}/` +
      (page ? `?page=${page}` : "");

    // 🔓 Public access if not logged in
    if (!access) {
      const res = await fetch(target, { cache: "no-store" });
      return NextResponse.json(await safeJson(res), { status: res.status });
    }

    // 🔐 Authenticated request
    let res = await fetch(target, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    // 🔁 Refresh on 401
    if (res.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);
      if (!tokens?.access) {
        return NextResponse.json(
          { detail: "SESSION_EXPIRED" },
          { status: 401 }
        );
      }

      access = tokens.access;

      res = await fetch(target, {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    }

    return NextResponse.json(await safeJson(res), { status: res.status });
  } catch (e: any) {
    return NextResponse.json(
      { detail: String(e) },
      { status: 500 }
    );
  }
}
