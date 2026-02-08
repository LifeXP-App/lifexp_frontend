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

export async function GET(request: Request) {
  const timestamp = new Date().toISOString();
  console.log("[API /discover/users] ===== Request received at", timestamp, "=====");
  console.log("[API /discover/users] Request URL:", request.url);
  console.log("[API /discover/users] Request method:", request.method);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    console.log("[API /discover/users] Base URL:", baseUrl);
    console.log("[API /discover/users] Base URL exists:", !!baseUrl);

    const cookieStore = await cookies();
    let access = cookieStore.get("access")?.value;
    console.log("[API /discover/users] Access token exists:", !!access);
    console.log("[API /discover/users] Access token (first 20 chars):", access?.substring(0, 20) + "...");

    if (!access) {
      console.error("[API /discover/users] No access token found");
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const target = `${baseUrl}/api/v1/discover/users/?limit=5`;
    console.log("[API /discover/users] Target URL:", target);

    console.log("[API /discover/users] Fetching from backend...");
    let res = await fetch(target, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    console.log("[API /discover/users] Backend response status:", res.status);
    console.log("[API /discover/users] Backend response ok:", res.ok);

    if (res.status === 401) {
      console.log("[API /discover/users] Token expired, refreshing...");
      const tokens = await sharedRefresh(refreshTokens);
      if (!tokens?.access) {
        console.error("[API /discover/users] Token refresh failed");
        return NextResponse.json({ detail: "SESSION_EXPIRED" }, { status: 401 });
      }

      access = tokens.access;
      console.log("[API /discover/users] Token refreshed, retrying...");

      res = await fetch(target, {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });

      console.log("[API /discover/users] Retry response status:", res.status);
    }

    const responseData = await safeJson(res);
    console.log("[API /discover/users] Response data:", responseData);
    console.log("[API /discover/users] Response data type:", typeof responseData);
    console.log("[API /discover/users] Has users array:", Array.isArray(responseData?.users));

    if (responseData?.users) {
      console.log("[API /discover/users] Users count:", responseData.users.length);
    }

    console.log("[API /discover/users] ===== Returning response =====");
    return NextResponse.json(responseData, { status: res.status });
  } catch (e: any) {
    console.error("[API /discover/users] ===== Exception caught =====");
    console.error("[API /discover/users] Error:", e);
    console.error("[API /discover/users] Error message:", e.message);
    console.error("[API /discover/users] Error stack:", e.stack);
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}
