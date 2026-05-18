import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(req: NextRequest) {
  // Check for Supabase session
  // Supabase stores session in cookies with pattern: sb-<project-ref>-auth-token
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create Supabase client with request cookies
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Don't persist in middleware
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    },
  });

  // Check if user has valid session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/users/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!users/login|users/register|api|_next|favicon.ico|auth).*)",
  ],
};
