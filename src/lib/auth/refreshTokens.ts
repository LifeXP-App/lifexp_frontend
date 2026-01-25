import { cookies } from "next/headers";

export async function refreshTokens() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get("refresh")?.value;

  if (!refresh) return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return null;

  const res = await fetch(`${baseUrl}/api/v1/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) return null;

  return {
    access: data?.access as string,
    refresh: data?.refresh as string | undefined, // ✅ rotation support
  };
}
