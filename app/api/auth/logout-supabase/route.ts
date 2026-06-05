import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Logout - clear Supabase session
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    const response = NextResponse.json({ ok: true });

    // Clear the cookies
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");

    return response;
  } catch (err) {
    console.error("[/api/auth/logout-supabase]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
