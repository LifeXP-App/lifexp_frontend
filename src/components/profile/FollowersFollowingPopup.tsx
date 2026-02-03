"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toggleFollow } from "@/lib/api/users";
import getAccentColors from "@/src/components/UserAccent";

type User = {
  id: number;
  username: string;
  fullname: string;
  profile_picture?: string;
  mastery_title?: string;
  masterytitle?: string;
  lifelevel: number;
  totalxp: number;
  is_following?: boolean;
  is_current_user?: boolean;
  is_own_profile?: boolean;
};

interface FollowersFollowingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | number;
  type: "followers" | "following";
  initialCount: number;
}

export default function FollowersFollowingPopup({
  isOpen,
  onClose,
  userId,
  type,
  initialCount,
}: FollowersFollowingPopupProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Track follow state for each user
  const [followStates, setFollowStates] = useState<Record<number, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});

  // Race condition handling
  const lastClickTimeRef = useRef<Record<number, number>>({});
  const abortControllersRef = useRef<Record<number, AbortController>>({});

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    } else {
      // Reset state when closed
      setUsers([]);
      setSearchQuery("");
      setPage(1);
    }
  }, [isOpen, type, userId]);

  useEffect(() => {
    if (isOpen && searchQuery) {
      const timer = setTimeout(() => {
        setPage(1);
        fetchUsers(1, searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const fetchUsers = async (pageNum: number = 1, search: string = searchQuery) => {
    setLoading(true);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;
      const endpoint = type === "followers" ? "followers" : "following";
      const params = new URLSearchParams({
        page: pageNum.toString(),
        page_size: "20",
      });

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`${apiUrl}/users/${userId}/${endpoint}/?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const usersList = data.results || [];

        // Initialize follow states
        const newFollowStates: Record<number, boolean> = {};
        usersList.forEach((user: User) => {
          newFollowStates[user.id] = user.is_following ?? false;
        });
        setFollowStates(newFollowStates);

        if (pageNum === 1) {
          setUsers(usersList);
        } else {
          setUsers((prev) => [...prev, ...usersList]);
        }

        setHasMore(!!data.next);
      } else {
        setUsers([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error(`Failed to fetch ${type}:`, err);
      setUsers([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (user: User) => {
    if (user.is_current_user) return;

    const now = Date.now();
    if (now - (lastClickTimeRef.current[user.id] || 0) < 500) {
      return;
    }
    lastClickTimeRef.current[user.id] = now;

    if (loadingStates[user.id]) return;

    if (abortControllersRef.current[user.id]) {
      abortControllersRef.current[user.id].abort();
    }

    abortControllersRef.current[user.id] = new AbortController();

    const previousFollowing = followStates[user.id];

    setFollowStates((prev) => ({ ...prev, [user.id]: !previousFollowing }));
    setLoadingStates((prev) => ({ ...prev, [user.id]: true }));

    try {
      const data = await toggleFollow(user.id);
      setFollowStates((prev) => ({ ...prev, [user.id]: data.following }));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setFollowStates((prev) => ({ ...prev, [user.id]: previousFollowing }));
      console.error("Failed to toggle follow:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      fetchUsers(page + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] rounded-2xl bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-gray-900 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold dark:text-white">
            {type === "followers" ? "Followers" : "Following"} ({initialCount})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && page === 1 ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div>
                      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
                      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>
                  <div className="h-8 w-20 rounded-lg bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? "No users found" : `No ${type} yet`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {users.map((user) => {
                const masteryTitle = user.mastery_title || user.masterytitle || "Novice";
                const accent = getAccentColors(masteryTitle);
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-3"
                  >
                    <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={user.username}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="h-12 w-12 rounded-full flex items-center justify-center"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${accent.gradStart}, ${accent.gradEnd})`,
                          }}
                        >
                          <span className="text-white text-lg font-bold">
                            {user.username[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold dark:text-white">{user.fullname}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          @{user.username} • Level {user.lifelevel}
                        </p>
                      </div>
                    </Link>

                    {!user.is_current_user && !user.is_own_profile && (
                      <button
                        onClick={() => handleFollowToggle(user)}
                        disabled={loadingStates[user.id]}
                        className={`px-4 py-1.5 text-sm rounded-lg font-medium text-white ${
                          loadingStates[user.id] ? "opacity-50 cursor-wait" : "cursor-pointer active:opacity-80"
                        } ${followStates[user.id] ? "bg-gray-700" : ""}`}
                        style={{ backgroundColor: followStates[user.id] ? undefined : "#4168e2" }}
                      >
                        {loadingStates[user.id] ? "..." : followStates[user.id] ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="mt-2 py-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load more"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
