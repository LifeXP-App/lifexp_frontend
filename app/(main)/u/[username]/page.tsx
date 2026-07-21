"use client";

import type { RadarDataPoint } from "@/src/components/RadarChart";
import { RadarChart, XPChart } from "@/src/components/charts/LazyCharts";
import getAccentColors, {
  hexToRgba as hexToRgbaUtil,
} from "@/src/components/UserAccent";
import PrivateProfileNotice from "@/src/components/profile/PrivateProfileNotice";
import { LiveAvatar } from "@/src/components/LiveAvatar";
import { useAuth } from "@/src/context/AuthContext";
import { usePopup } from "@/src/context/PopupContext";
// Mock data removed - using real API data now
import { UserProfile } from "@/src/lib/types";
import { FireIcon, LockClosedIcon, PlusIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { FaLinkedin, FaSquareWhatsapp } from "react-icons/fa6";
import { toggleFollow } from "@/lib/api/users";
import posthog from "posthog-js";

interface PageProps {
  params: Promise<{ username: string }>;
}

import Achievement from "@/src/components/profile/Achievement";
import DefaultUserProfilePicture from "@/src/components/profile/DefaultUserProfilePicture";
import FollowersFollowingPopup from "@/src/components/profile/FollowersFollowingPopup";

type UserPost = {
  id: number;
  uid: string;
  user_username: string;
  user_profile_picture: string;
  user_mastery_title: string;
  user_life_level: number;
  title: string;
  content: string;
  post_image_url: string;
  duration: string;
  duration_display: string;
  status: string;
  xp_distribution: {
    logic: number;
    energy: number;
    social: number;
    physique: number;
    creativity: number;
  };
  total_xp: number;
  tags: string;
  tags_list: string[];
  justification: string;
  likes_count: number;
  comments_count: number;
  liked_by: boolean;
  created_at: string;
  updated_at: string;
};

export default function ProfilePage({ params }: PageProps) {
  const { username } = use(params);
  const router = useRouter();
  const { me, session, loading: authLoading } = useAuth();
  const { openMasteryPopup } = usePopup();
  const queryClient = useQueryClient();

  // Follow state itself is optimistic local state (see handleFollow /
  // handleUnfollow below), but the underlying counts are also embedded in
  // both this profile's cache and the signed-in user's own — without this,
  // navigating away and back inside the cache's staleTime window re-syncs
  // the optimistic state right back to the pre-toggle numbers.
  const invalidateFollowCaches = useCallback(
    (targetUsername: string) => {
      queryClient.invalidateQueries({
        queryKey: ["profile-users", targetUsername, me?.username],
      });
      if (me?.username) {
        queryClient.invalidateQueries({
          queryKey: ["profile-users", me.username, me.username],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["discover-users"] });
    },
    [queryClient, me?.username],
  );

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);

  // Dynamic data state
  type Activity = {
    activity_id: number;
    activity_uid: string;
    name: string;
    emoji?: string;
    total_duration_seconds: number;
    total_duration_minutes: number;
  };

  type Session = {
    id: string;
    uid: string;
    activity?: {
      id: string;
      name: string;
      emoji?: string;
      type?: string;
    };
    total_duration_seconds: number;
    started_at: string;
    ended_at?: string;
  };

  type Goal = {
    id: number;
    uid: string;
    title: string;
    emoji?: string;
    status: string;
  };

  const [isXlViewport, setIsXlViewport] = useState(false);

  const [showShare, setShowShare] = useState(false);
  const [showFollowersPopup, setShowFollowersPopup] = useState(false);
  const [showFollowingPopup, setShowFollowingPopup] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");

  // Race condition handling refs
  const lastFollowClickRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const { data: usersData, isLoading: usersQueryLoading } = useQuery({
    queryKey: ["profile-users", username, me?.username],
    queryFn: async () => {
      const [profileResponse, currentResponse] = await Promise.all([
        fetch(`/api/users/profile/${username}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }),
        fetch(`/api/users/profile/${me?.username}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }),
      ]);

      const profileData = profileResponse.ok ? await profileResponse.json() : null;
      const currentData = currentResponse.ok ? await currentResponse.json() : null;

      return { profileData, currentData };
    },
    enabled: !authLoading && !!me?.username,
    // Profile header + follow counts — optimistic local state handles the
    // follow/unfollow UI regardless, so this can cache generously.
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const profileUser = (usersData?.profileData as UserProfile | null) ?? null;
  const currentUser = (usersData?.currentData as UserProfile | null) ?? null;
  const isLoading = authLoading || usersQueryLoading;

  // isFollowing/followersCount/followingCount are optimistically mutated by
  // handleFollow/handleUnfollow below, so they stay local state — re-synced
  // from the query whenever fresh profile data lands (initial load or
  // navigating to a different user).
  useEffect(() => {
    if (!usersData?.profileData) return;
    setIsFollowing(usersData.profileData.isFollowing ?? false);
    setFollowersCount(usersData.profileData.followers_count ?? 0);
    setFollowingCount(usersData.profileData.following_count ?? 0);
  }, [usersData]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Set profile URL on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setProfileUrl(window.location.origin + `/u/${username}`);
    }
  }, [username]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const updateViewport = () => setIsXlViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  // Each profile section owns its request so a slower endpoint does not block
  // otherwise-ready content from being shown.
  const { data: ongoingGoals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["profile-stats", username, "ongoing-goals"],
    queryFn: async () => {
      const response = await fetch(
        `/api/users/${username}/goals?status=ongoing`,
        { cache: "no-store" },
      );
      if (!response.ok) return [] as Goal[];
      const data = await response.json();
      return (Array.isArray(data) ? data : data.results || []) as Goal[];
    },
    enabled: !!username && !authLoading && !!session?.access_token,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: weeklyXP = [], isLoading: weeklyXPLoading } = useQuery({
    queryKey: ["profile-stats", username, "weekly-xp"],
    queryFn: async () => {
      const response = await fetch(`/api/stats/weekly?username=${username}`, {
        cache: "no-store",
      });
      if (!response.ok) return [] as { date: string; xp: number }[];

      const data = await response.json();
      const dailyBreakdown = data.daily_breakdown || {};
      return Object.keys(dailyBreakdown)
        .sort()
        .map((date) => {
          const dateObj = new Date(date);
          const isToday = dateObj.toDateString() === new Date().toDateString();
          return {
            date: isToday
              ? "Today"
              : dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
            xp: dailyBreakdown[date].xp || 0,
          };
        });
    },
    enabled: !!username && !authLoading && !!session?.access_token,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: recentSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["profile-stats", username, "recent-sessions", 5],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/sessions?limit=5`, {
        cache: "no-store",
      });
      if (!response.ok) return [] as Session[];
      const data = await response.json();
      return (Array.isArray(data) ? data : data.results || []) as Session[];
    },
    enabled: !!username && !authLoading && !!session?.access_token,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch top activities (requires the numeric profile user id)
  const { data: topActivities = [], isLoading: topActivitiesLoading } = useQuery({
    queryKey: ["profile-top-activities", profileUser?.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/users/${profileUser?.id}/top-activities?limit=5`,
        {
          cache: "no-store",
        },
      );

      if (!res.ok) return [] as Activity[];
      const data = await res.json();
      return (data.top_activities || []) as Activity[];
    },
    enabled: !authLoading && !!profileUser?.id && !!session?.access_token,
    // Top-activities ranking changes rarely — safe to cache generously.
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const { data: userPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["profile-posts", username],
    queryFn: async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;
      const response = await fetch(`${apiUrl}/users/${username}/posts/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) return [] as UserPost[];
      const data = await response.json();
      return (data.results || []) as UserPost[];
    },
    enabled: !!username,
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Format member since date
  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleFollow = async () => {
    if (!profileUser) return;

    // Prevent spam clicking - rate limit to 500ms between clicks
    const now = Date.now();
    if (now - lastFollowClickRef.current < 500) {
      return;
    }
    lastFollowClickRef.current = now;

    // Prevent concurrent requests
    if (isFollowingLoading) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    // Optimistic UI update
    const previousFollowing = isFollowing;
    const previousFollowersCount = followersCount;

    setIsFollowing(!isFollowing);
    setFollowersCount(
      isFollowing
        ? followersCount - 1
        : followersCount + 1
    );
    setIsFollowingLoading(true);

    try {
      const data = await toggleFollow(profileUser.id);

      // Sync with server response (only if component is still mounted)
      if (isMountedRef.current) {
        setIsFollowing(data.following);
        setFollowersCount(data.followers_count);
        setFollowingCount(data.following_count);
        posthog.capture("user_followed", { target_user: profileUser.username, action: "follow" });
      }
      invalidateFollowCaches(profileUser.username);
    } catch (error) {
      // Don't show error if request was aborted intentionally
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      // Revert on error (only if component is still mounted)
      if (isMountedRef.current) {
        setIsFollowing(previousFollowing);
        setFollowersCount(previousFollowersCount);
        console.error("Failed to follow user:", error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsFollowingLoading(false);
      }
    }
  };

  const handleUnfollow = async () => {
    if (!profileUser) return;

    // Prevent spam clicking - rate limit to 500ms between clicks
    const now = Date.now();
    if (now - lastFollowClickRef.current < 500) {
      return;
    }
    lastFollowClickRef.current = now;

    // Prevent concurrent requests
    if (isFollowingLoading) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    // Optimistic UI update
    const previousFollowing = isFollowing;
    const previousFollowersCount = followersCount;

    setIsFollowing(false);
    setFollowersCount(Math.max(0, followersCount - 1));
    setIsFollowingLoading(true);

    try {
      const data = await toggleFollow(profileUser.id);

      // Sync with server response (only if component is still mounted)
      if (isMountedRef.current) {
        setIsFollowing(data.following);
        setFollowersCount(data.followers_count);
        setFollowingCount(data.following_count);
        posthog.capture("user_followed", { target_user: profileUser.username, action: "unfollow" });
      }
      invalidateFollowCaches(profileUser.username);
    } catch (error) {
      // Don't show error if request was aborted intentionally
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      // Revert on error (only if component is still mounted)
      if (isMountedRef.current) {
        setIsFollowing(previousFollowing);
        setFollowersCount(previousFollowersCount);
        console.error("Failed to unfollow user:", error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsFollowingLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <main
        className="w-full flex flex-col md:flex-row overflow-y-auto bg-gray-100 dark:bg-dark-1 animate-pulse"
        style={{ minHeight: "calc(100vh - 60px)" }}
      >
        <div className="w-full px-4 py-4 sm:px-6 md:px-8 lg:px-12 xl:px-24">
          {/* PROFILE HEADER SKELETON */}
          <div className="relative rounded-xl flex flex-col md:flex-row justify-between w-full mb-4 animate-pulse">
            <div className="pt-2 sm:p-2 mb-4 flex flex-col gap-2 w-full">
              <div className="flex flex-row items-center gap-4 sm:gap-8 w-full mb-4">
                {/* Avatar */}
                <div className="shrink-0">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gray-200 dark:bg-dark-3" />
                </div>

                {/* Name + stats */}
                <div className="flex flex-col w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-dark-3" />
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-dark-3" />
                  </div>

                  <div className="h-3 w-40 rounded bg-gray-200 dark:bg-dark-3 mb-4" />

                  <div className="mt-4 flex gap-6 sm:gap-8 text-sm">
                    <div className="text-center sm:text-left">
                      <div className="h-4 w-10 rounded bg-gray-200 dark:bg-dark-3 mx-auto sm:mx-0" />
                      <div className="h-3 w-12 rounded bg-gray-200 dark:bg-dark-3 mt-2 mx-auto sm:mx-0" />
                    </div>

                    <div className="text-center sm:text-left">
                      <div className="h-4 w-10 rounded bg-gray-200 dark:bg-dark-3 mx-auto sm:mx-0" />
                      <div className="h-3 w-16 rounded bg-gray-200 dark:bg-dark-3 mt-2 mx-auto sm:mx-0" />
                    </div>

                    <div className="text-center sm:text-left">
                      <div className="h-4 w-10 rounded bg-gray-200 dark:bg-dark-3 mx-auto sm:mx-0" />
                      <div className="h-3 w-16 rounded bg-gray-200 dark:bg-dark-3 mt-2 mx-auto sm:mx-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Title + bio */}
              <div className="h-4 w-3/5 rounded bg-gray-200 dark:bg-dark-3 mt-2" />
              <div className="h-3 w-4/5 rounded bg-gray-200 dark:bg-dark-3 mt-2" />
              <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-dark-3 mt-2" />

              {/* Ongoing goals skeleton pills */}
              <div className="mt-4">
                <div className="h-3 w-28 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-full bg-gray-200 dark:bg-dark-3 w-24 h-7"
                    />
                  ))}
                </div>
              </div>

              {/* Buttons skeleton */}
              <span className="flex flex-col sm:flex-row md:gap-2 gap-4 items-center w-full mt-2 sm:mt-4">
                <div className="w-48 h-10 rounded-lg bg-gray-200 dark:bg-dark-3" />
                <div className="w-48 h-10 rounded-lg bg-gray-200 dark:bg-dark-3" />
              </span>
            </div>

            {/* Desktop chart skeleton */}
            <div className="hidden xl:flex w-full focus:outline-none justify-end p-4 sm:p-6 overflow-visible">
              <div className="w-full max-w-[360px] h-[320px] overflow-visible py-6">
                <div className="w-full h-full rounded-xl bg-gray-200 dark:bg-dark-3" />
              </div>
            </div>
          </div>

          {/* Mobile chart skeleton */}
          <div className="xl:hidden my-4 flex justify-center w-full animate-pulse">
            <div className="w-full bg-white dark:bg-dark-2 rounded-xl border-2 border-gray-200 dark:border-[var(--border)] p-6">
              <div className="mx-auto w-full max-w-[280px] h-72 rounded-xl bg-gray-200 dark:bg-dark-3" />
            </div>
          </div>

          {/* STREAK / LEVEL / XP skeleton cards */}
          <div className="my-4 flex flex-col sm:flex-row justify-between text-sm gap-4 animate-pulse">
            <div className="bg-white dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full p-4">
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
              <div className="h-5 w-16 rounded bg-gray-200 dark:bg-dark-3" />
            </div>

            <div className="bg-white dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full p-4">
              <div className="h-4 w-28 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
              <div className="h-3 w-40 rounded bg-gray-200 dark:bg-dark-3" />
            </div>

            <div className="bg-gray-200 dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-gray-900 w-full p-4 animate-pulse">
              <div className="h-5 w-28 rounded bg-gray-300 dark:bg-dark-3 mb-3" />
              <div className="h-3 w-44 rounded bg-gray-300 dark:bg-dark-3" />
            </div>
          </div>

          {/* Weekly XP chart skeleton */}
          <div className="p-4 sm:p-6 my-4 bg-white dark:bg-dark-2 dark:border-gray-900 border-2 border-gray-200 rounded-2xl w-full animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <span className="flex gap-3 items-center">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-dark-3" />
                <div className="h-4 w-40 rounded bg-gray-200 dark:bg-dark-3" />
              </span>
            </div>

            <div className="relative h-48 sm:h-64 rounded-xl bg-gray-200 dark:bg-dark-3" />
          </div>

          {/* Top Activities + Recent Sessions skeleton */}
          <div className="flex flex-col md:flex-row gap-4 animate-pulse">
            <div className="p-4 sm:p-6 my-2 bg-white border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 rounded-2xl w-full">
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-dark-3 mb-6" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-4 rounded bg-gray-200 dark:bg-dark-3" />
                    <div className="h-10 w-10 rounded bg-gray-200 dark:bg-dark-3" />
                    <div className="h-4 w-40 rounded bg-gray-200 dark:bg-dark-3" />
                  </div>
                  <div className="h-4 w-14 rounded bg-gray-200 dark:bg-dark-3" />
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-6 my-2 bg-white border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 rounded-2xl w-full">
              <div className="h-4 w-36 rounded bg-gray-200 dark:bg-dark-3 mb-6" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-3 rounded-lg mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-gray-200 dark:bg-dark-3" />
                      <div>
                        <div className="h-4 w-44 rounded bg-gray-200 dark:bg-dark-3 mb-2" />
                        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-dark-3" />
                      </div>
                    </div>
                    <div className="h-4 w-14 rounded bg-gray-200 dark:bg-dark-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements skeleton */}
          <div className="max-w-6xl mx-auto px-2 p-2 pb-12 my-4 rounded-sm w-full animate-pulse">
            <div className="h-5 w-36 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden"
                >
                  <div className="h-36 bg-gray-200 dark:bg-[var(--dark-2)]" />
                  <div className="p-4 bg-white dark:bg-[#151618] border border-gray-200 dark:border-[var(--border)] border-t-0 rounded-b-2xl">
                    <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-3" />
                    <div className="h-3 w-full rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-2" />
                    <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-4" />
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1,2,3,4,5].map((j) => (
                        <div key={j} className="h-8 rounded-lg bg-gray-200 dark:bg-[var(--dark-2)]" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!profileUser) {
    return (
      <main
        className="w-full flex flex-col items-center justify-center"
        style={{ minHeight: "calc(100vh - 60px)" }}
      >
        <h1 className="text-2xl font-bold dark:text-[var(--foreground)] mb-4">
          User not found
        </h1>
        <p className="text-gray-500 dark:text-[var(--muted)]">
          @{username+" "}  doesn&apos;t exist
        </p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main
        className="w-full flex flex-col items-center justify-center"
        style={{ minHeight: "calc(100vh - 60px)" }}
      >
        <h1 className="text-2xl font-bold dark:text-[var(--foreground)] mb-4">
          Error loading user data
        </h1>
        <p className="text-gray-500 dark:text-[var(--muted)]">Please try again</p>
      </main>
    );
  }

  // Check if profile content should be visible
  const canViewContent = profileUser.visibility === "public" || isFollowing;

  // Calculate radar chart points with comparison data
  // Find the maximum XP across all aspects for both users to set the scale
  const allAspectXP = [
    currentUser.aspects.physique.currentXP,
    currentUser.aspects.energy.currentXP,
    currentUser.aspects.logic.currentXP,
    currentUser.aspects.creativity.currentXP,
    currentUser.aspects.social.currentXP,
    profileUser.aspects.physique.currentXP,
    profileUser.aspects.energy.currentXP,
    profileUser.aspects.logic.currentXP,
    profileUser.aspects.creativity.currentXP,
    profileUser.aspects.social.currentXP,
  ];
  const maxAspectXP = Math.max(...allAspectXP, 100); // Minimum of 100 for visibility

  const radarData: RadarDataPoint[] = [
    {
      aspect: "Physique",
      value: currentUser.aspects.physique.currentXP,
      comparisonValue: profileUser.aspects.physique.currentXP,
      fullMark: maxAspectXP,
    },
    {
      aspect: "Energy",
      value: currentUser.aspects.energy.currentXP,
      comparisonValue: profileUser.aspects.energy.currentXP,
      fullMark: maxAspectXP,
    },
    {
      aspect: "Logic",
      value: currentUser.aspects.logic.currentXP,
      comparisonValue: profileUser.aspects.logic.currentXP,
      fullMark: maxAspectXP,
    },
    {
      aspect: "Creativity",
      value: currentUser.aspects.creativity.currentXP,
      comparisonValue: profileUser.aspects.creativity.currentXP,
      fullMark: maxAspectXP,
    },
    {
      aspect: "Social",
      value: currentUser.aspects.social.currentXP,
      comparisonValue: profileUser.aspects.social.currentXP,
      fullMark: maxAspectXP,
    },
  ];

  // Calculate total XP for the week
  const totalWeeklyXP = weeklyXP.reduce((sum, day) => sum + day.xp, 0);

  const accent = getAccentColors(profileUser.masteryTitle);
  const hexToRgba = hexToRgbaUtil;

  // Helper function to get time ago text
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "week", seconds: 604800 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  };

  return (
    <main
      className="w-full flex flex-col md:flex-row overflow-y-auto"
      style={{ minHeight: "calc(100vh - 60px)" }}
    >
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 ">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-[var(--border)] p-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-[var(--foreground)]">
                Share Profile
              </h3>
              <button
                onClick={() => setShowShare(false)}
                className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer dark:hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>

            {/* Profile link box */}
            <div className="mb-4 text-gray-600 dark:text-[var(--muted)] flex gap-2 w-full">
              <div className="flex items-center gap-2 w-full bg-gray-100 dark:bg-dark-3 border border-gray-200 dark:border-[var(--border)] rounded-lg p-2 ">
                <p
                  id="profile-url"
                  className="text-md active:opacity-75 m-2 truncate text-gray-700 dark:text-[var(--muted)] flex-1"
                >
                  {profileUrl}
                </p>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(profileUrl);
                    const button = document.querySelector("#copy-button");
                    if (button) {
                      button.textContent = "Copied!";
                      // disable button
                      button.setAttribute("disabled", "true");
                      setTimeout(() => {
                        button.textContent = "Copy";
                        button.removeAttribute("disabled");
                      }, 2000);
                    }
                  }}
                  id="copy-button"
                  className="text-sm font-medium  py-1 disabled:opacity-50 w-18 h-full rounded-full cursor-pointer active:opacity-75 text-white"
                  style={{ backgroundColor: accent.primary }}
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Social buttons */}
            <div className="grid grid-cols-3 gap-3">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  profileUrl,
                )}`}
                target="_blank"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-[var(--border)] hover:bg-gray-100 dark:hover:bg-dark-3 transition"
              >
                <span className="text-xl">𝕏</span>
                <span className="text-xs mt-1 text-gray-600 dark:text-[var(--muted)]">
                  X
                </span>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  profileUrl,
                )}`}
                target="_blank"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-[var(--border)] hover:bg-gray-100 dark:hover:bg-dark-3 transition"
              >
                <FaLinkedin className="w-8 h-8 fill-blue-500" />
                <span className="text-xs mt-1 text-gray-600 dark:text-[var(--muted)]">
                  LinkedIn
                </span>
              </a>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(profileUrl)}`}
                target="_blank"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 dark:border-[var(--border)] hover:bg-gray-100 dark:hover:bg-dark-3 transition"
              >
                <FaSquareWhatsapp className="w-8 h-8 fill-green-700" />
                <span className="text-xs mt-1 text-gray-600 dark:text-[var(--muted)]">
                  WhatsApp
                </span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Followers Popup */}
      {profileUser && (
        <FollowersFollowingPopup
          isOpen={showFollowersPopup}
          onClose={() => setShowFollowersPopup(false)}
          userId={profileUser.id}
          requestUserId={currentUser.id}
          requestUsername={currentUser.username}
          type="followers"
          initialCount={followersCount}
        />
      )}

      {/* Following Popup */}
      {profileUser && (
        <FollowersFollowingPopup
          isOpen={showFollowingPopup}
          onClose={() => setShowFollowingPopup(false)}
          userId={profileUser.id}
          requestUserId={currentUser.id}
          requestUsername={currentUser.username}
          type="following"
          initialCount={followingCount}
        />
      )}

      <div className="w-full bg-gray-100 dark:bg-dark-1 px-4 py-4 sm:px-6 md:px-8 lg:px-12 xl:px-24">
        {/* PROFILE HEADER */}
        <div className="relative rounded-xl flex flex-col md:flex-row justify-between w-full mb-4">
          <div className="pt-2 sm:p-2 mb-4 flex flex-col gap-2 w-full">
            <div className="flex flex-row items-center gap-4 sm:gap-8 w-full mb-4">
              <div className="shrink-0">
                <LiveAvatar username={profileUser.username}>
                  {profileUser.avatar ? (
                    <Image
                      src={profileUser.avatar}
                      width={96}
                      height={96}
                      alt={profileUser.username}
                      className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover"
                    />
                  ) : (
                    <DefaultUserProfilePicture
                      username={profileUser.username}
                      accent={{
                        gradStart: accent.gradStart,
                        gradEnd: accent.gradEnd,
                      }}
                    />
                  )}
                </LiveAvatar>
              </div>
              <div className="flex flex-col w-full">
                <span className="flex items-center gap-2 mb-1">
                  <p className="text-base font-bold dark:text-[var(--foreground)]">
                    {profileUser.fullname}
                  </p>
                  <p className="text-base font-medium text-gray-500 dark:text-[var(--muted)]">
                    @{profileUser.username}
                  </p>
                  {profileUser.visibility === "private" && (
                    <LockClosedIcon className="w-4 h-4 text-gray-400 dark:text-[var(--muted)]" />
                  )}
                </span>
                <span className="flex items-center cursor-pointer">
                  <p
                    className="text-sm font-bold"
                    style={{ color: accent.text }}
                  >
                    {profileUser.masteryTitle}
                  </p>
                  <button
                    type="button"
                    onClick={openMasteryPopup}
                    className="mastery-info flex float-right cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 ms-2 text-gray-400 dark:text-[var(--muted)] group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="sr-only">Show Info</span>
                  </button>
                </span>
                <div className="mt-4 flex gap-6 sm:gap-8 text-sm">
                  <div className="text-center sm:text-left">
                    <p className="font-semibold dark:text-[var(--foreground)]">
                      {profileUser.posts_count}
                    </p>
                    <p className="text-gray-500 dark:text-[var(--muted)]">Goals</p>
                  </div>
                  <div
                    className="text-center sm:text-left cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => setShowFollowersPopup(true)}
                  >
                    <p className="font-semibold dark:text-[var(--foreground)]">
                      {followersCount}
                    </p>
                    <p className="text-gray-500 dark:text-[var(--muted)]">
                      Followers
                    </p>
                  </div>
                  <div
                    className="text-center sm:text-left cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => setShowFollowingPopup(true)}
                  >
                    <p className="font-semibold dark:text-[var(--foreground)]">
                      {followingCount}
                    </p>
                    <p className="text-gray-500 dark:text-[var(--muted)]">
                      Following
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {canViewContent && (
              <>
                <p className="text-gray-800 dark:text-[var(--muted)] font-semibold">
                  {profileUser.title}
                </p>

                <p className="text-gray-500 dark:text-[var(--muted)]  whitespace-pre-wrap">
                  {profileUser.bio}
                </p>
                {/* Ongoing Goals */}
                <div className="mt-2">
                  <h3 className="font-bold text-sm mb-3 dark:text-[var(--foreground)]">
                    Ongoing Goals
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {goalsLoading ? (
                      [1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-full bg-gray-200 dark:bg-dark-3 w-24 h-7 animate-pulse"
                        />
                      ))
                    ) : ongoingGoals.length > 0 ? (
                      ongoingGoals.map((goal) => (
                        <span
                          key={goal.id || goal.uid}
                          className="px-3 py-1.5 rounded-full text-xs font-medium flex gap-2 items-center"
                          style={{
                            backgroundColor: hexToRgba(accent.primary, 0.15),
                            border: `1px solid ${accent.primary}`,
                            color: accent.primary,
                          }}
                        >
                          <p className="text-md">{goal.emoji || "🎯"}</p>
                          {goal.title}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-[var(--muted)] text-sm">
                        No ongoing goals
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            <span className="flex flex-col sm:flex-row md:gap-2 gap-4 items-center w-full mt-2 sm:mt-4">
              {me?.username === profileUser.username ? (
                <button
                  onClick={() => router.push("/u/edit")}
                  style={{ backgroundColor: accent.primary }}
                  className="w-full font-medium active:opacity-80 sm:w-auto p-2 rounded-lg cursor-pointer px-12 text-white "
                >
                  Edit Profile
                </button>
              ) : isFollowing ? (
                <button
                  onClick={handleUnfollow}
                  disabled={isFollowingLoading}
                  className={`font-medium py-2 rounded-lg text-center w-48 text-white bg-gray-700 ${
                    isFollowingLoading ? "opacity-50 cursor-wait" : "cursor-pointer"
                  }`}
                >
                  {isFollowingLoading ? "Loading..." : "Unfollow"}
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={isFollowingLoading}
                  className={`font-medium py-2 rounded-lg text-center w-48 text-white ${
                    isFollowingLoading ? "opacity-50 cursor-wait" : "cursor-pointer"
                  }`}
                  style={{ backgroundColor: accent.primary }}
                >
                  {isFollowingLoading ? "Loading..." : "Follow"}
                </button>
              )}

              <button
                onClick={() => setShowShare(true)}
                className="cursor-pointer font-medium bg-black/70 hover:bg-black text-white text-center py-2 rounded-lg w-48 dark:hover:bg-gray-100 dark:bg-white dark:text-black"
              >
                Share
              </button>
            </span>
          </div>

          {/* Desktop Chart - Comparison Mode */}
          {canViewContent && isXlViewport && (
            <div className="flex w-full focus:outline-none justify-end p-4 sm:p-6 overflow-visible">
              <div className="w-full max-w-[360px] h-[320px] overflow-visible py-6">
                <RadarChart
                  data={radarData}
                  masteryTitle={profileUser.masteryTitle}
                  username={profileUser.username}
                  comparisonMode={currentUser.username !== profileUser.username}
                  comparisonUsername={profileUser.username}
                />
              </div>
            </div>
          )}
        </div>

        {/* Private Profile Notice */}
        {!canViewContent && (
          <PrivateProfileNotice username={profileUser.username} />
        )}

        {/* Profile Content - Only visible for public profiles or if following */}
        {canViewContent && (
          <>
            {/* Mobile Chart - Comparison Mode */}
            {!isXlViewport && <div className="my-4 flex justify-center w-full">
              <div className="w-full bg-white dark:bg-dark-2 rounded-xl border-2 border-gray-200 dark:border-[var(--border)] p-6">
                <div className="mx-auto w-full max-w-[280px] h-72">
                  <RadarChart
                    data={radarData}
                    masteryTitle={profileUser.masteryTitle}
                    username={profileUser.username}
                    comparisonMode={true}
                    comparisonUsername={profileUser.username}
                  />
                </div>
              </div>
            </div>}

            {/* STREAK, LIFE LEVEL, XP CARDS */}
            <div className="my-4 flex flex-col sm:flex-row justify-between text-sm gap-4">
              {/* Streak count */}
              <div className="bg-white dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-[var(--border)] w-full flex flex-col rounded-md items-center justify-between p-4">
                          
                          <p className="text-sm dark:text-[var(--muted)]">Streak Count</p>
              
                          <p className={`text-lg font-extrabold text-gray-400 dark:text-[var(--muted)] flex gap-1 items-center ${
                                profileUser.streak_active
                                  ? "text-orange-500 "
                                  : "text-gray-400 dark:text-[var(--muted)]"
                              }`}>
                            <FireIcon
                              className={`w-6 h-6 inline-block ml-1 ${
                                profileUser.streak_active
                                  ? "text-orange-500"
                                  : "text-gray-400 dark:text-[var(--muted)] "
                              }`}
                            />
                            {profileUser.streak_count}
                          </p>
                        </div>

              {/* life level */}
              <div className="bg-white dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-[var(--border)] w-full flex flex-col rounded-md items-center justify-between p-4">
                <span className="flex items-center justify-center gap-1">
                  <p className="text-gray-600 dark:text-[var(--foreground)] text-base sm:text-lg font-bold">
                    Life Level {profileUser.lifeLevel}
                  </p>
                </span>
                <span className="flex items-center justify-center gap-1">
                  <p
                    style={{ fontSize: "11px" }}
                    className="text-gray-500 dark:text-[var(--muted)]"
                  >
                    Member since{" "}
                    {profileUser.joined_date
                      ? formatMemberSince(profileUser.joined_date)
                      : "Unknown"}
                  </p>
                </span>
              </div>

              {/* XP */}
              <div className="bg-gray-200 dark:bg-dark-2 border-2 rounded-xl border-gray-200 dark:border-[var(--border)] w-full flex flex-col rounded-md items-center justify-between p-4">
                <span className="flex items-center justify-center gap-1">
                  <p
                    style={{ color: accent.text }}
                    className="text-lg font-bold"
                  >
                    {profileUser.totalXP.toLocaleString()} XP
                  </p>
                </span>
                <span className="flex items-center justify-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="#AAA"
                    className="h-4 w-4 dark:fill-gray-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p
                    style={{ fontSize: "11px" }}
                    className="text-gray-400 dark:text-[var(--muted)]"
                  >
                    {profileUser.xp_to_next_master_level
                      ? `${profileUser.xp_to_next_master_level.toLocaleString()} XP to next mastery`
                      : "Mastery progress"}
                  </p>
                </span>
              </div>
            </div>

            {/* WEEKLY XP CHART */}
            {weeklyXPLoading ? (
              <div className="p-4 sm:p-6 my-4 bg-white dark:bg-dark-2 dark:border-[var(--border)] border-2 border-gray-200 rounded-2xl w-full animate-pulse">
                <div className="flex justify-between items-center mb-4">
                  <span className="flex gap-3 items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-dark-3" />
                    <div className="h-4 w-40 rounded bg-gray-200 dark:bg-dark-3" />
                  </span>
                </div>
                <div className="relative h-48 sm:h-64 rounded-xl bg-gray-200 dark:bg-dark-3" />
              </div>
            ) : (
              <div className="p-4 sm:p-6 my-4 bg-white dark:bg-dark-2 dark:border-[var(--border)] border-2 border-gray-200 rounded-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <span className="flex gap-3 items-center">
                  {profileUser.avatar ? (
                    <Image
                      src={profileUser.avatar}
                      width={32}
                      height={32}
                      alt={profileUser.username}
                      className="h-8 w-8 aspect-square rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${accent.gradStart}, ${accent.gradEnd})`,
                      }}
                    >
                      <span className="text-white text-sm font-bold">
                        {profileUser.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h2 className="opacity-50 dark:opacity-70 text-lg sm:text-xl font-regular dark:text-[var(--muted)]">
                    {totalWeeklyXP.toLocaleString()} XP this week
                  </h2>
                </span>
              </div>

              <div className="relative h-48 sm:h-64">
                <XPChart
                  data={weeklyXP}
                  username={profileUser.username}
                  totalXP={totalWeeklyXP}
                  accentColor={accent.primary}
                  gradientStart={accent.gradStart}
                  gradientEnd={accent.gradEnd}
                />
              </div>
              </div>
            )}

            {/* TOP ACTIVITIES & RECENT SESSIONS */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="p-4 sm:p-6 my-2 bg-white border-2 border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] rounded-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold dark:text-[var(--foreground)]">
                    Top Activities
                  </h2>
                  <span className="text-gray-500 dark:text-[var(--muted)] text-sm"></span>
                </div>

                {topActivitiesLoading ? (
                  <p className="text-gray-500 dark:text-[var(--muted)] text-sm">
                    Loading activities...
                  </p>
                ) : topActivities.length > 0 ? (
                  topActivities.map((activity, index) => {
                    const totalSeconds = activity.total_duration_seconds || 0;
                    const hours = Math.floor(totalSeconds / 3600);
                    const duration =
                      hours < 1
                        ? `${Math.round(totalSeconds / 60)}m`
                        : `${hours}h`;
                    return (
                      <Link
                        key={activity.activity_id ?? `activity-${index}`}
                        href={
                          activity.activity_uid
                            ? `/a/${activity.activity_uid}`
                            : "#"
                        }
                        className="block space-y-4 mb-6"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 sm:space-x-4">
                            <span className="text-gray-400 dark:text-[var(--muted)] font-semibold w-5">
                              {index + 1}
                            </span>
                            <div className="flex items-center space-x-2 sm:space-x-4">
                              <p className="text-2xl">{activity.emoji || "📊"}</p>
                              <span className="font-medium text-sm sm:text-base truncate dark:text-[var(--foreground)]">
                                {activity.name || "Unknown Activity"}
                              </span>
                            </div>
                          </div>
                          <span className="font-semibold text-sm sm:text-md dark:text-[var(--muted)]">
                            {duration}
                          </span>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-gray-500 dark:text-[var(--muted)] text-sm">
                    No activity data yet
                  </p>
                )}
              </div>

              {/* Recent Sessions */}
              <div className="p-4 sm:p-6 my-2 bg-white border-2 border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] rounded-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold dark:text-[var(--foreground)]">
                    Recent Sessions
                  </h2>
                  <span className="text-gray-500 dark:text-[var(--muted)] text-sm"></span>
                </div>

                {sessionsLoading ? (
                  <p className="text-gray-500 dark:text-[var(--muted)] text-sm">
                    Loading sessions...
                  </p>
                ) : recentSessions.length > 0 ? (
                  recentSessions.map((session) => {
                    // Format duration
                    const totalSeconds = session.total_duration_seconds || 0;
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const duration =
                      hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

                    // Format timestamp
                    const timestamp = getTimeAgo(session.ended_at || session.started_at);

                    return (
                      <div
                        key={session.id || session.uid}
                        className="p-3 hover:bg-gray-100 dark:hover:bg-dark-3 rounded-lg transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 sm:space-x-4">
                            <div className="flex items-center space-x-2 sm:space-x-4">
                              <p className="text-2xl">
                                {session.activity?.emoji || "📝"}
                              </p>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm sm:text-base truncate dark:text-[var(--foreground)]">
                                  {session.activity?.name || "Session"}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-[var(--muted)]">
                                  {timestamp}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-gray-600 dark:text-[var(--muted)] font-semibold text-sm">
                            {duration}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 dark:text-[var(--muted)] text-sm">
                    No recent sessions
                  </p>
                )}
              </div>
            </div>

            {/* EXPERIENCES */}
            <div className="max-w-6xl mx-auto px-2 p-2 pb-12 my-4 rounded-sm w-full">
              <h2 className="text-lg sm:text-xl font-semibold dark:text-[var(--foreground)] mb-6">
                Achievements
              </h2>

              {postsLoading ? (
                <div className="flex flex-col gap-8 animate-pulse">
                  {/* Ongoing skeleton */}
                  <div>
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-2xl border border-gray-200 dark:border-[var(--border)] p-4 bg-white dark:bg-[#151618]">
                          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-3" />
                          <div className="h-3 w-full rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-2" />
                          <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-4" />
                          <div className="grid grid-cols-5 gap-1.5">
                            {[1,2,3,4,5].map((j) => (
                              <div key={j} className="h-8 rounded-lg bg-gray-200 dark:bg-[var(--dark-2)]" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Completed skeleton */}
                  <div>
                    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-4" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-2xl overflow-hidden">
                          <div className="h-36 bg-gray-200 dark:bg-[var(--dark-2)]" />
                          <div className="p-4 bg-white dark:bg-[#151618] border border-gray-200 dark:border-[var(--border)] border-t-0 rounded-b-2xl">
                            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-3" />
                            <div className="h-3 w-full rounded bg-gray-200 dark:bg-[var(--dark-2)] mb-2" />
                            <div className="grid grid-cols-5 gap-1.5 mt-3">
                              {[1,2,3,4,5].map((j) => (
                                <div key={j} className="h-8 rounded-lg bg-gray-200 dark:bg-[var(--dark-2)]" />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                (() => {
                  const ongoingPosts = userPosts.filter((p) => p.status === "ongoing");
                  const otherPosts = userPosts.filter((p) => p.status === "completed");
                  const isOwnProfile = me?.username === profileUser.username;

                  if (ongoingPosts.length === 0 && otherPosts.length === 0) {
                    if (isOwnProfile) {
                      return (
                        <div className="mt-12 flex flex-col items-center justify-center text-center py-16 px-6 ">
                          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-dark-3 flex items-center justify-center mb-4">
                            <RocketLaunchIcon className="w-8 h-8 text-gray-500 dark:text-[var(--muted)]" />
                          </div>
                          <h3 className="text-lg font-bold text-black dark:text-[var(--foreground)] mb-1">
                            No goals yet? let&apos;s change that
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-[var(--muted)] max-w-xs">
                            Every big achievement starts with a single goal. Create your first one and start earning XP today.
                          </p>
                          <button
                            type="button"
                            onClick={() => router.push("/goals")}
                            className="mt-5 flex items-center gap-2 rounded-2xl bg-[var(--rookie-primary)]  text-white font-semibold py-3 px-6 hover:opacity-90 transition cursor-pointer"
                          >
                            <PlusIcon className="w-5 h-5" />
                            <span>Create Your First Goal</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-[var(--muted)]">
                          No posts yet
                        </p>
                      </div>
                    );
                  }

                  const sharedProps = (post: UserPost) => ({
                    emoji: post.tags_list[0]?.charAt(0) || "🎯",
                    title: post.title,
                    description: post.content,
                    xp: post.total_xp,
                    coverImage: post.post_image_url || null,
                    timeText: getTimeAgo(post.created_at),
                    accent: { primary: accent.primary, secondary: accent.secondary },
                    stats: {
                      physique: post.xp_distribution.physique,
                      energy: post.xp_distribution.energy,
                      logic: post.xp_distribution.logic,
                      creativity: post.xp_distribution.creativity,
                      social: post.xp_distribution.social,
                    },
                  });
                  return (
                    <div className="flex flex-col gap-10">
                      {ongoingPosts.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-500 dark:text-[var(--muted)] uppercase tracking-wide mb-4">
                            Ongoing
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {ongoingPosts.map((post) => (
                              <Link key={post.id} href={`/goals/${post.uid}`}>
                                <Achievement compact {...sharedProps(post)} />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {otherPosts.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-500 dark:text-[var(--muted)] uppercase tracking-wide mb-4">
                            Completed
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {otherPosts.map((post) => (
                              <Link key={post.id} href={`/goals/${post.uid}`}>
                                <Achievement {...sharedProps(post)} />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
