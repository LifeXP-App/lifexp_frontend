import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const res = await fetch(`${baseUrl}/api/v1/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("access", data.access, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // ✅ localhost dev
    path: "/",
  });

  response.cookies.set("refresh", data.refresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // ✅ localhost dev
    path: "/",
  });

  return response;
}
