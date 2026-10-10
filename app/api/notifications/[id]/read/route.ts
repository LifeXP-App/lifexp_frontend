import { NextResponse } from "next/server";
import { getAuthToken } from "@/src/lib/auth/getAuthToken";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ detail: "Invalid notification" }, { status: 400 });
  const token = await getAuthToken(req);
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return NextResponse.json({ detail: "API unavailable" }, { status: 503 });
  try {
    const response = await fetch(`${base}/api/v1/notifications/${id}/read/`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ detail: "Could not mark notification read" }, { status: 502 });
  }
}
