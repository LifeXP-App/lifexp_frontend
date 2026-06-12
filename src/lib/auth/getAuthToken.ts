import { cookies } from "next/headers";

/**
 * Get authentication token from request
 * Supports both:
 * 1. Authorization header (Supabase session token)
 * 2. Legacy cookies (for backwards compatibility)
 */
export async function getAuthToken(request: Request): Promise<string | null> {
  // First, try to get token from Authorization header (Supabase)
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token) {
      return token;
    }
  }

  const cookieStore = await cookies();

  // Supabase session cookie — set by /api/auth/login/supabase
  const sbToken = cookieStore.get("sb-access-token")?.value;
  if (sbToken) return sbToken;

  // Legacy Django JWT cookie — backwards compatibility
  const legacyToken = cookieStore.get("sb-access-token")?.value;
  if (legacyToken) return legacyToken;

  return null;
}
 