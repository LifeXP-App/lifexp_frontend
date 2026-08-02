import { NextRequest, NextResponse } from "next/server";
import { serverAuthFetch } from "@/src/lib/auth/serverAuthFetch";

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const body = await request.json();

  const res = await serverAuthFetch(`${baseUrl}/api/v1/auth/discord/link/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
