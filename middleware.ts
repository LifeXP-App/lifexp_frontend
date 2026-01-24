import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const access = req.cookies.get("access")?.value;

  if (!access) {
    return NextResponse.redirect(new URL("/users/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!users/login|users/register|api|_next|favicon.ico).*)",
  ],
};
