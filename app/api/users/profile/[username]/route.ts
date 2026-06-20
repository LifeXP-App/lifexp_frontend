import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;

  const cookieStore = await cookies();
  const access = cookieStore.get("sb-access-token")?.value;

  if (!access) {
    return NextResponse.json(
      { detail: "Not authenticated" },
      { status: 401 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const res = await fetch(
    `${baseUrl}/api/v1/users/${username}/`,
    {
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await res.json();

  return NextResponse.json(data, {
    status: res.status,
  });
}