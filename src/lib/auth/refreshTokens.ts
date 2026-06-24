import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export async function refreshTokens() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get("sb-refresh-token")?.value;

  if (!refresh) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refresh,
  });

  if (error || !data.session) return null;

  const { session } = data;
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };

  cookieStore.set("sb-access-token", session.access_token, cookieOptions);

  if (session.refresh_token) {
    cookieStore.set("sb-refresh-token", session.refresh_token, cookieOptions);
  }

  return {
    access: session.access_token,
    refresh: session.refresh_token,
  };
}
