"use client";

import { useQuery } from "@tanstack/react-query";
import { authedFetch } from "@/src/lib/api/authedFetch";
import type { UserProfile } from "@/src/lib/types";

// Scope private/follow data to the viewer, and share XP/level across surfaces.
export function useUserProfile(username?: string, viewer?: string, enabled = true) {
  return useQuery({
    queryKey: ["user-profile", username, viewer],
    queryFn: async (): Promise<UserProfile> => {
      const response = await authedFetch(
        `/api/users/profile/${encodeURIComponent(username!)}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("Failed to fetch user profile");
      return response.json();
    },
    enabled: enabled && !!username && !!viewer,
    staleTime: 30_000,
    gcTime: 10 * 60 * 1000,
  });
}
