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

  // Fallback: Check legacy cookies
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get("access")?.value;
  if (accessCookie) {
    return accessCookie;
  }

  return null;
}
