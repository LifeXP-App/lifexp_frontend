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

export async function GET(
  req: Request,
  context: { params: Promise<{ uid: string }> }
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const { uid } = await context.params;

    const cookieStore = await cookies();
    let access = cookieStore.get("access")?.value;

    if (!access) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const target = `${baseUrl}/api/v1/activities/${uid}/sessions/friends/`;

    let res = await fetch(target, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    if (res.status === 401) {
      await refreshAccess();
      const updatedStore = await cookies();
      access = updatedStore.get("access")?.value;

      res = await fetch(target, {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    }

    const data = await safeJson(res);
    return NextResponse.json(data, { status: res.status });

  } catch (err: any) {
    return NextResponse.json(
      { detail: "Failed to load friends sessions", error: String(err) },
      { status: 500 }
    );
  }
}