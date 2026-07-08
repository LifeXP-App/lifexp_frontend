import { sharedRefresh } from "@/src/lib/auth/refreshLock";
import { refreshTokens } from "@/src/lib/auth/refreshTokens";
import { getAuthToken } from "@/src/lib/auth/getAuthToken";
import { NextResponse } from "next/server";

async function authedFetch(req: Request, url: string, options: RequestInit = {}) {
  let access = await getAuthToken(req);

  if (!access) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (res.status !== 401) return res;

  const tokens = await sharedRefresh(refreshTokens);
  if (!tokens?.access) {
    return NextResponse.json({ detail: "Session expired" }, { status: 401 });
  }

  access = tokens.access;

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

export async function GET(
  req: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const res = await authedFetch(req, `${baseUrl}/api/v1/sessions/${sessionId}/comments/`);

  if (res instanceof NextResponse) return res;

  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ detail: text }, { status: res.status });
  }
}

async function readBody(req: Request) {
  const text = await req.text();
  if (!text) return {};

  try {
    const parsed = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null ? parsed : { content: text };
  } catch {
    return { content: text };
  }
}

function normalizeCommentBody(body: Record<string, unknown> | undefined) {
  const content =
    typeof body?.content === "string"
      ? body.content
      : typeof body?.comment === "string"
        ? body.comment
        : "";

  if (!content) return body ?? {};

  return {
    ...(body ?? {}),
    content,
    comment: content,
  };
}

export async function POST(
  req: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const body = normalizeCommentBody(await readBody(req));
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const res = await authedFetch(req, `${baseUrl}/api/v1/sessions/${sessionId}/comments/`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (res instanceof NextResponse) return res;

  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ detail: text }, { status: res.status });
  }
}
