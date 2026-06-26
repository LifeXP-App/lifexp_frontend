import { supabase } from "@/src/lib/supabase";
import { ActivityType } from "@/src/lib/types/activityMeta";

/**
 * Activity returned by the backend (matches the DRF ActivitySerializer).
 */
export interface ApiActivity {
  id: number;
  uid?: string;
  name: string;
  description?: string;
  activity_type: ActivityType;
  emoji?: string;
  total_xp?: number;
  xp_distribution?: Record<string, number>;
  reasoning?: string;
  created_at?: string;
  created_by?: {
    username: string;
    fullname: string;
    mastery_title: string;
  } | null;
}

/**
 * Normalized result of an AI-validated custom-activity creation attempt.
 * Mirrors the contract of `POST /api/v1/activities/custom/`.
 */
export type CustomActivityResult =
  | { status: "success"; activity: ApiActivity }
  | { status: "warning"; message: string; fundamentalizedVersions: string[] }
  | { status: "exists"; message: string }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

/**
 * Auth-aware fetch wrapper that attaches the Supabase access token.
 * Mirrors `goalsFetch` in `src/lib/services/goals.ts`.
 */
async function activitiesFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  if (session?.access_token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  return fetch(input, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });
}

export const ActivitiesService = {
  /**
   * Create a custom activity from just its name. The backend validates and
   * scores it with Gemini, so the response can be a success, a "too complex"
   * warning with simpler suggestions, a duplicate, or an invalid name.
   */
  async createCustomActivity(name: string): Promise<CustomActivityResult> {
    const trimmed = name.trim();
    if (!trimmed) {
      return { status: "invalid", message: "Activity name is required" };
    }

    let res: Response;
    try {
      res = await activitiesFetch("/api/activities/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
    } catch {
      return {
        status: "error",
        message: "Couldn't reach the server. Please try again.",
      };
    }

    let payload: {
      status?: string;
      message?: string;
      activity?: ApiActivity;
      fundamentalized_versions?: string[];
      detail?: string;
    } = {};
    try {
      payload = await res.json();
    } catch {
      payload = {};
    }

    if (res.ok && payload.status === "success" && payload.activity) {
      return { status: "success", activity: payload.activity };
    }

    if (payload.status === "warning") {
      return {
        status: "warning",
        message: payload.message ?? "Activity name is too complex",
        fundamentalizedVersions: payload.fundamentalized_versions ?? [],
      };
    }

    // Duplicate — surface it so the UI can point the user at the existing one.
    if (res.status === 400 && payload.message === "Activity already exists") {
      return { status: "exists", message: payload.message };
    }

    if (res.status === 422 || payload.message === "Activity name is invalid") {
      return {
        status: "invalid",
        message: payload.message ?? "Activity name is invalid",
      };
    }

    return {
      status: "error",
      message: payload.message ?? payload.detail ?? "Failed to create activity",
    };
  },
};
