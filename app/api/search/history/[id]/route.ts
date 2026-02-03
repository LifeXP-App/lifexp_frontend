import { NextResponse, NextRequest } from "next/server";
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

// DELETE - Delete specific search history item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const cookieStore = await cookies();
    let access = cookieStore.get("access")?.value;

    if (!access) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const target = `${baseUrl}/api/v1/search/history/${id}/`;

    let res = await fetch(target, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    if (res.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);
      if (!tokens?.access) {
        return NextResponse.json({ detail: "SESSION_EXPIRED" }, { status: 401 });
      }

      access = tokens.access;

      res = await fetch(target, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    }

    return NextResponse.json(await safeJson(res), { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}
