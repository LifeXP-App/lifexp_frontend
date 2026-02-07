"use client";
import { toggleFollow } from "@/lib/api/users";
import Link from "next/link";
import { useRef, useState } from "react";

type SuggestedUser = {
  id: string | number;
  username: string;
  fullname: string;
  profile_picture: string;
  lifelevel: number;
  is_following?: boolean;
};

type DiscoverUsersProps = {
  suggestedUsers: SuggestedUser[];
};

export function DiscoverUsers({ suggestedUsers }: DiscoverUsersProps) {
  // Track follow state for each user
  const [followStates, setFollowStates] = useState<
    Record<string | number, boolean>
  >(() => {
    const initial: Record<string | number, boolean> = {};
    suggestedUsers.forEach((user) => {
      initial[user.id] = user.is_following ?? false;
    });
    return initial;
  });

  // Track loading state for each user
  const [loadingStates, setLoadingStates] = useState<
    Record<string | number, boolean>
  >({});

  // Race condition handling
  const lastClickTimeRef = useRef<Record<string | number, number>>({});
  const abortControllersRef = useRef<Record<string | number, AbortController>>(
    {},
  );

  const handleFollowToggle = async (user: SuggestedUser) => {
    const userId = user.id;

    // Prevent spam clicking - rate limit to 500ms between clicks
    const now = Date.now();
    if (now - (lastClickTimeRef.current[userId] || 0) < 500) {
      return;
    }
    lastClickTimeRef.current[userId] = now;

    // Prevent concurrent requests
    if (loadingStates[userId]) return;

    // Cancel any pending request for this user
    if (abortControllersRef.current[userId]) {
      abortControllersRef.current[userId].abort();
    }

    // Create new abort controller for this request
    abortControllersRef.current[userId] = new AbortController();

    // Optimistic UI update
    const previousFollowing = followStates[userId];

    setFollowStates((prev) => ({ ...prev, [userId]: !previousFollowing }));
    setLoadingStates((prev) => ({ ...prev, [userId]: true }));

    try {
      const data = await toggleFollow(userId);

      // Sync with server response
      setFollowStates((prev) => ({ ...prev, [userId]: data.following }));
    } catch (error) {
      // Don't show error if request was aborted intentionally
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      // Revert on error
      setFollowStates((prev) => ({ ...prev, [userId]: previousFollowing }));
      console.error("Failed to toggle follow:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [userId]: false }));
    }
  };
  return (
    <>
      {/* DISCOVER USERS */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900">
        <p className="text-md  font-semibold mb-4 dark:text-white">
          Discover players
        </p>

        <div className="flex flex-col gap-3">
          {suggestedUsers.map((u) => (
            <div
              key={u.username}
              className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-dark-2"
            >
              <Link href={`/u/${u.username}`} className="flex gap-2">
                <img
                  src={u.profile_picture}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <p className="text-sm dark:text-white">{u.fullname}</p>
                  <p className="text-xs text-black/40 dark:text-white/40">
                    Life Level {u.lifelevel}
                  </p>
                </div>
              </Link>

              <button
                onClick={() => handleFollowToggle(u)}
                disabled={loadingStates[u.id]}
                className={`px-6 py-1 text-sm rounded-lg font-medium text-white ${
                  loadingStates[u.id]
                    ? "opacity-50 cursor-wait"
                    : "cursor-pointer active:opacity-80"
                } ${followStates[u.id] ? "bg-gray-700" : ""}`}
                style={{
                  backgroundColor: followStates[u.id] ? undefined : "#4168e2",
                }}
              >
                {loadingStates[u.id]
                  ? "..."
                  : followStates[u.id]
                    ? "Following"
                    : "Follow"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
