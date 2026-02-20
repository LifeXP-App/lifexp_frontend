import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { sharedRefresh } from "@/src/lib/auth/refreshLock";

async function authedFetch(url: string, options: RequestInit = {}) {
    const cookieStore = await cookies();
    let access = cookieStore.get("access")?.value;

    if (!access) {
        return NextResponse.json(
            { detail: "Not authenticated" },
            { status: 401 }
        );
    }

    let res = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (res.status !== 401) return res;

    // 🔄 refresh
    const tokens = await sharedRefresh(refreshTokens);
    if (!tokens?.access) {
        return NextResponse.json(
            { detail: "Session expired" },
            { status: 401 }
        );
    }

    access = tokens.access;

    // retry with new access
    return fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    let url = `${baseUrl}/api/v1/goals/`;
    if (status) {
        url += `?status=${status}`;
    }

    const res = await authedFetch(url);

    // If authedFetch returned a NextResponse (auth error), return it directly
    if (res instanceof NextResponse) {
        return res;
    }

    const text = await res.text();
    try {
        const data = JSON.parse(text);
        return NextResponse.json(data, { status: res.status });
    } catch {
        return NextResponse.json({ detail: text }, { status: res.status });
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const res = await authedFetch(`${baseUrl}/api/v1/goals/`, {
        method: "POST",
        body: JSON.stringify(body),
    });

    if (res instanceof NextResponse) {
        return res;
    }

    const text = await res.text();
    try {
        const data = JSON.parse(text);
        return NextResponse.json(data, { status: res.status });
    } catch {
        return NextResponse.json({ detail: text }, { status: res.status });
    }
}
