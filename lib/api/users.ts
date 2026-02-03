// User API Types
export interface FollowResponse {
  following: boolean;
  followers_count: number;
  following_count: number;
}

/**
 * Toggle follow/unfollow for a user
 * Uses optimistic UI pattern - caller should handle state updates
 */
export async function toggleFollow(userId: string | number): Promise<FollowResponse> {
  const response = await fetch(`/api/users/${userId}/follow`, {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.error || "Failed to toggle follow");
  }

  return response.json();
}
