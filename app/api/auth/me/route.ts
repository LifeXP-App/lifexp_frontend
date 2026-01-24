import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies(); // ✅ await
  const access = cookieStore.get("access")?.value;

  if (!access) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const res = await fetch(`${baseUrl}/api/v1/auth/me/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access}`,
    },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
