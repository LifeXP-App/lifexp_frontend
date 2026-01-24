import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Clear cookies
  res.cookies.set("access", "", { path: "/", maxAge: 0 });
  res.cookies.set("refresh", "", { path: "/", maxAge: 0 });

  return res;
}
