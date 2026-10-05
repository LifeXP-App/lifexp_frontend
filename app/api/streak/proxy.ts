import { NextResponse } from "next/server";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";
import { getAuthToken } from "@/src/lib/auth/getAuthToken";

export async function proxyStreak(request: Request, suffix = "") {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) return NextResponse.json({ detail: "API unavailable" }, { status: 503 });
    const token = await getAuthToken(request);
    if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    const requestBody = request.method === "GET" ? undefined : await request.text();
    const forward = (access: string) => fetch(`${baseUrl}/api/v1/streak/${suffix}`, {
      method: request.method,
      headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
      body: requestBody,
      cache: "no-store",
    });
    let response = await forward(token);
    if (response.status === 401) {
      const tokens = await sharedRefresh(refreshTokens);
      if (tokens?.access) response = await forward(tokens.access);
    }
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "Unable to reach streak service. Please try again." }, { status: 502 });
  }
}
