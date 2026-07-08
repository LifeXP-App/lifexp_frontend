import { NextResponse } from "next/server";
import { getAuthToken } from "@/src/lib/auth/getAuthToken";
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

async function authedFetch(access: string, url: string, options: RequestInit = {}) {
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

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${tokens.access}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

async function fetchCommentsEndpoint(
  access: string,
  baseUrl: string,
  id: string,
  options: RequestInit = {}
) {
  const primaryUrl = `${baseUrl}/api/v1/posts/${id}/comments/`;
  const fallbackUrl = `${baseUrl}/api/v1/goals/${id}/comments/`;

  const primaryRes = await authedFetch(access, primaryUrl, options);
  if (primaryRes instanceof NextResponse) return primaryRes;
  if (primaryRes.status !== 404) return primaryRes;

  return authedFetch(access, fallbackUrl, options);
}

/* ---------------- GET COMMENTS ---------------- */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const access = await getAuthToken(req);
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await fetchCommentsEndpoint(access, baseUrl, id);

  if (res instanceof NextResponse) return res;
  return NextResponse.json(await safeJson(res), { status: res.status });
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

/* ---------------- POST COMMENT ---------------- */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = normalizeCommentBody(await readBody(req));

  const access = await getAuthToken(req);
  if (!access) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
  const res = await fetchCommentsEndpoint(access, baseUrl, id, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (res instanceof NextResponse) return res;
  return NextResponse.json(await safeJson(res), { status: res.status });
}
