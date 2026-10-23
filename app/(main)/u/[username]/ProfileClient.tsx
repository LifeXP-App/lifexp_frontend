"use client";

import { useMasteryPrimaryColor } from "@/src/lib/hooks/useMasteryAccent";
import StreakCount, { streakTileStyle } from "@/src/components/streaks/StreakCount";
import type { RadarDataPoint } from "@/src/components/RadarChart";
import { RadarChart, XPChart } from "@/src/components/charts/LazyCharts";
import getAccentColors, {
  hexToRgba as hexToRgbaUtil,
} from "@/src/components/UserAccent";
import PrivateProfileNotice from "@/src/components/profile/PrivateProfileNotice";
import SharePopup from "@/src/components/SharePopup";
import { LiveAvatar } from "@/src/components/LiveAvatar";
import { useAuth } from "@/src/context/AuthContext";
import { usePopup } from "@/src/context/PopupContext";
// Mock data removed - using real API data now
import { UserProfile } from "@/src/lib/types";
import { ACTIVITY_META, ActivityType } from "@/src/lib/types/activityMeta";
import { toRoman } from "@/src/lib/utils/toRoman";
import { Cog6ToothIcon, LockClosedIcon, PlusIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import Pagination from "@/src/components/Pagination";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { toggleFollow } from "@/lib/api/users";
import { authedFetch } from "@/src/lib/api/authedFetch";
import posthog from "posthog-js";

interface PageProps {
  params: Promise<{ username: string }>;
}

function formatMemberSince(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

import { CompletedGoalBadge, OngoingGoalCard, type ProfileGoal } from "@/src/components/profile/GoalCards";
import DefaultUserProfilePicture from "@/src/components/profile/DefaultUserProfilePicture";
import FollowersFollowingPopup from "@/src/components/profile/FollowersFollowingPopup";
import ProfileSessionPopup from "@/src/components/profile/ProfileSessionPopup";
import SessionTimeline, {
  SessionTimelineSkeleton,
  groupSessionsByDay,
} from "@/src/components/profile/SessionTimeline";
import WeekSummary from "@/src/components/profile/WeekSummary";

type UserPost = {
  id: number;
  uid: string;
  user_username: string;
  user_profile_picture: string;
  user_mastery_title: string;
  user_life_level: number;
  title: string;
  emoji?: string;
  content: string;
  description?: string;
  post_image_url: string;
  completion_picture_url?: string | null;
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
  completion_date?: string | null;
  sessions_count?: number | null;
  last_session_at?: string | null;
};

export default function ProfileClient({ params }: PageProps) {
  const { username } = use(params);
  const router = useRouter();
  const { me, supabaseUser, loading: authLoading } = useAuth();
  const myPrimaryColor = useMasteryPrimaryColor();
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
    session_number?: number;
    activity?: {
      id: string;
      uid?: string;
      name: string;
      emoji?: string;
      type?: string;
    };
    goal?: { uid: string; title: string } | null;
    total_duration_seconds: number;
    focused_duration_seconds?: number;
    started_at: string;
    ended_at?: string;
    completion_picture?: string | null;
    xp_physique?: number;
    xp_energy?: number;
    xp_logic?: number;
    xp_creativity?: number;
    xp_social?: number;
  };

  type Goal = {
    id: number;
    uid: string;
    title: string;
    emoji?: string;
    status: string;
    xp_distribution?: Record<ActivityType, number>;
  };

  const [isXlViewport, setIsXlViewport] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const [showShare, setShowShare] = useState(false);
  const [showFollowersPopup, setShowFollowersPopup] = useState(false);
  const [showFollowingPopup, setShowFollowingPopup] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");

  const [isSessionPopupOpen, setIsSessionPopupOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const handleOpenSessionPopup = (session: Session) => {
    setSelectedSession(session);
    setIsSessionPopupOpen(true);
  };

  // Race condition handling refs
  const lastFollowClickRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const { data: usersData, isLoading: usersQueryLoading } = useQuery({
    queryKey: ["profile-users", username, me?.username],
    queryFn: async () => {
      const [profileResponse, currentResponse] = await Promise.all([
        authedFetch(`/api/users/profile/${username}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }),
        authedFetch(`/api/users/profile/${me?.username}`, {
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
  const accountCreatedAt =
    profileUser?.joined_date ??
    (profileUser?.username === me?.username
      ? me?.created_at ?? supabaseUser?.created_at
      : null);
  const memberSinceDate = accountCreatedAt
    ? formatMemberSince(accountCreatedAt)
    : null;

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);

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
    // Gated on username/authLoading only — these hit Next proxy routes that
    // read the httpOnly auth cookie server-side, not the client Supabase
    // SDK's session, which can lag/fail to hydrate on mobile (leaving
    // session?.access_token falsy indefinitely and these queries permanently
    // disabled even though the user is genuinely authenticated).
    enabled: !!username && !authLoading,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: weeklyXP = [], isLoading: weeklyXPLoading } = useQuery({
    queryKey: ["profile-stats", username, "weekly-xp"],
    queryFn: async () => {
      const response = await authedFetch(`/api/stats/weekly?username=${username}`, {
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
    // Gated on username/authLoading only — these hit Next proxy routes that
    // read the httpOnly auth cookie server-side, not the client Supabase
    // SDK's session, which can lag/fail to hydrate on mobile (leaving
    // session?.access_token falsy indefinitely and these queries permanently
    // disabled even though the user is genuinely authenticated).
    enabled: !!username && !authLoading,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: recentSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["profile-stats", username, "recent-sessions", 5],
    queryFn: async () => {
      const response = await authedFetch(`/api/users/${username}/sessions?limit=5`, {
        cache: "no-store",
      });
      if (!response.ok) return [] as Session[];
      const data = await response.json();
      return (Array.isArray(data) ? data : data.results || []) as Session[];
    },
    // Gated on username/authLoading only — these hit Next proxy routes that
    // read the httpOnly auth cookie server-side, not the client Supabase
    // SDK's session, which can lag/fail to hydrate on mobile (leaving
    // session?.access_token falsy indefinitely and these queries permanently
    // disabled even though the user is genuinely authenticated).
    enabled: !!username && !authLoading,
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
    enabled: !authLoading && !!profileUser?.id,
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

  // "This week" on the profile timeline — Monday-start, local midnight, the
  // same week boundary the full sessions page's heatmap uses.
  const [weekStart] = useState(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return start;
  });

  const { data: weekSessions = [] } = useQuery({
    queryKey: ["profile-session-week", username, weekStart.toISOString()],
    queryFn: async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;
      const query = new URLSearchParams({ after: weekStart.toISOString(), page_size: "100" });
      const response = await authedFetch(
        `${apiUrl}/users/${username}/sessions/gallery/?${query}`,
        { cache: "no-store" },
      );
      if (!response.ok) return [] as Session[];
      const data = await response.json();
      return (data.results ?? []) as Session[];
    },
    enabled: !!username && !authLoading,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // The Sessions section pages through the whole history, newest first.
  const SESSIONS_PAGE_SIZE = 8;
  const [sessionsPage, setSessionsPage] = useState(1);
  const { data: sessionsPageData, isLoading: sessionsPageLoading, isFetching: sessionsPageFetching } = useQuery({
    queryKey: ["profile-session-page", username, sessionsPage],
    queryFn: async () => {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;
      const query = new URLSearchParams({
        page: String(sessionsPage),
        page_size: String(SESSIONS_PAGE_SIZE),
      });
      const response = await authedFetch(
        `${apiUrl}/users/${username}/sessions/gallery/?${query}`,
        { cache: "no-store" },
      );
      if (!response.ok) return { results: [] as Session[], count: 0 };
      const data = await response.json();
      return {
        results: (data.results ?? []) as Session[],
        count: (data.count ?? 0) as number,
      };
    },
    placeholderData: keepPreviousData,
    enabled: !!username && !authLoading,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

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
            <div className="w-full bg-white dark:bg-dark-2 rounded-xl border border-gray-200 dark:border-[var(--border)] p-6">
              <div className="mx-auto w-full max-w-[280px] h-72 rounded-xl bg-gray-200 dark:bg-dark-3" />
            </div>
          </div>

          {/* STREAK / LEVEL / XP skeleton cards */}
          <div className="my-4 flex flex-col sm:flex-row justify-between text-sm gap-4 animate-pulse">
            <div className="bg-white dark:bg-dark-2 border rounded-xl border-gray-200 dark:border-gray-900 w-full p-4">
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
              <div className="h-5 w-16 rounded bg-gray-200 dark:bg-dark-3" />
            </div>

            <div className="bg-white dark:bg-dark-2 border rounded-xl border-gray-200 dark:border-gray-900 w-full p-4">
              <div className="h-4 w-28 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
              <div className="h-3 w-40 rounded bg-gray-200 dark:bg-dark-3" />
            </div>

            <div className="bg-gray-200 dark:bg-dark-2 border rounded-xl border-gray-200 dark:border-gray-900 w-full p-4 animate-pulse">
              <div className="h-5 w-28 rounded bg-gray-300 dark:bg-dark-3 mb-3" />
              <div className="h-3 w-44 rounded bg-gray-300 dark:bg-dark-3" />
            </div>
          </div>

          {/* Weekly XP chart skeleton */}
          <div className="p-4 sm:p-6 my-4 bg-white dark:bg-dark-2 dark:border-gray-900 border border-gray-200 rounded-2xl w-full animate-pulse">
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
            <div className="p-4 sm:p-6 my-2 bg-white border border-gray-200 dark:bg-dark-2 dark:border-gray-900 rounded-2xl w-full">
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

            <div className="p-4 sm:p-6 my-2 bg-white border border-gray-200 dark:bg-dark-2 dark:border-gray-900 rounded-2xl w-full">
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

          {/* Goals + Sessions skeleton (same surfaces as the real sections) */}
          <div className="w-full pb-12 my-4 animate-pulse">
            <div className="h-6 w-20 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex h-32 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-[var(--border)] dark:bg-dark-2"
                >
                  <div className="w-24 sm:w-28 bg-gray-200 dark:bg-dark-3" />
                  <div className="flex-1 space-y-3 p-4">
                    <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-dark-3" />
                    <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-dark-3" />
                    <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-dark-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full pb-12 my-4 animate-pulse">
            <div className="h-6 w-24 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <div className="h-3 w-40 rounded bg-gray-200 dark:bg-dark-3" />
                <div className="h-14 w-full rounded-xl bg-gray-200 dark:bg-dark-3" />
                <div className="h-14 w-4/5 rounded-xl bg-gray-200 dark:bg-dark-3" />
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--border)] dark:bg-dark-2 sm:p-6 space-y-4">
                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-dark-3" />
                <div className="h-8 w-28 rounded bg-gray-200 dark:bg-dark-3" />
                <div className="h-16 w-full rounded-xl bg-gray-200 dark:bg-dark-3" />
              </div>
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
      aspect: "Social",
      value: currentUser.aspects.social.currentXP,
      comparisonValue: profileUser.aspects.social.currentXP,
      fullMark: maxAspectXP,
    },
    {
      aspect: "Creativity",
      value: currentUser.aspects.creativity.currentXP,
      comparisonValue: profileUser.aspects.creativity.currentXP,
      fullMark: maxAspectXP,
    },
    {
      aspect: "Logic",
      value: currentUser.aspects.logic.currentXP,
      comparisonValue: profileUser.aspects.logic.currentXP,
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
      <SharePopup
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={profileUrl}
        heading="Share Profile"
        accentColor={accent.primary}
      />

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

      <ProfileSessionPopup
        session={selectedSession}
        isOpen={isSessionPopupOpen}
        onClose={() => setIsSessionPopupOpen(false)}
      />

      <div className="w-full bg-gray-100 dark:bg-dark-1 px-4 py-4 sm:px-6 md:px-8 lg:px-12 xl:px-24">
        {/* PROFILE HEADER */}
        <div className="relative rounded-xl flex flex-col md:flex-row justify-between w-full mb-4">
          {me?.username === profileUser.username && (
            <Link
              href="/settings"
              aria-label="Settings"
              className="md:hidden absolute top-2 right-2 z-10 p-2 rounded-full text-foreground/70 dark:text-[var(--foreground)]/70 active:opacity-60"
            >
              <Cog6ToothIcon className="w-6 h-6" />
            </Link>
          )}
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
                  <p className="text-base font-semibold dark:text-[var(--foreground)]">
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
                    className="text-sm font-semibold"
                    style={{ color: accent.text }}
                  >
                    {profileUser.masteryTitle}
                    {profileUser.masteryLevel > 0 && ` ${toRoman(profileUser.masteryLevel)}`}
                  </p>
                  <button
                    type="button"
                    onClick={openMasteryPopup}
                    className="mastery-info flex float-right cursor-pointer"
                  >
                    <svg
                      className={`w-4 h-4 ms-2 transition-colors ${
                        profileUser.masteryTitle === "Rookie"
                          ? "text-gray-400 dark:text-[var(--muted)] group-hover:text-gray-500 dark:group-hover:text-gray-400"
                          : ""
                      }`}
                      style={
                        profileUser.masteryTitle === "Rookie"
                          ? undefined
                          : { color: accent.primary, opacity: 0.5 }
                      }
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
                  <h3 className="font-semibold text-sm mb-3 dark:text-[var(--foreground)]">
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
                      ongoingGoals.map((goal) => {
                        // Goals have no single "activity type" field of their
                        // own — xp_distribution (summed across the goal's
                        // sessions) is what actually carries it, so the
                        // dominant aspect (highest XP) is this goal's color.
                        // Falls back to the mastery accent for goals with no
                        // XP yet (freshly created, no sessions logged), and
                        // ALWAYS uses the mastery accent once the profile
                        // owner has an actual mastery (not Rookie) — mastery
                        // color takes over from per-goal aspect coloring.
                        const dist = goal.xp_distribution;
                        const dominantAspect = dist
                          ? (Object.keys(dist) as ActivityType[]).reduce<ActivityType | null>(
                              (best, key) =>
                                !best || dist[key] > dist[best] ? key : best,
                              null,
                            )
                          : null;
                        const hasAspectColor =
                          profileUser.masteryTitle === "Rookie" &&
                          !!(dominantAspect && dist && dist[dominantAspect] > 0);
                        // ACTIVITY_META's colors are CSS var references
                        // ("var(--aspect-x)"), not hex strings — hexToRgba
                        // (built for accent.primary's hex fallback table)
                        // can't parse those, so the 15%-alpha background uses
                        // the var's paired "-rgb" companion instead when an
                        // aspect color is in play.
                        const goalColor = hasAspectColor
                          ? ACTIVITY_META[dominantAspect!].cssColorVar
                          : accent.primary;
                        const goalBackground = hasAspectColor
                          ? `rgba(${ACTIVITY_META[dominantAspect!].cssColorVarRgb}, 0.15)`
                          : hexToRgba(accent.primary, 0.15);

                        return (
                          <span
                            key={goal.id || goal.uid}
                            className="px-3 py-1.5 rounded-full text-xs font-medium flex gap-2 items-center"
                            style={{
                              backgroundColor: goalBackground,
                              border: `1px solid ${goalColor}`,
                              color: goalColor,
                            }}
                          >
                            <p className="text-md">{goal.emoji || "🎯"}</p>
                            {goal.title}
                          </span>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 dark:text-[var(--muted)] text-sm">
                        No ongoing goals
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            <span className="flex flex-row gap-2 sm:gap-2 items-center w-full mt-2 sm:mt-4">
              {me?.username === profileUser.username ? (
                <button
                  onClick={() => router.push("/u/edit")}
                  style={{ backgroundColor: accent.primary }}
                  className="flex-1 min-w-0 sm:flex-none font-semibold active:opacity-80 sm:w-auto py-2.5 rounded-xl cursor-pointer px-4 sm:px-12 text-white "
                >
                  Edit Profile
                </button>
              ) : isFollowing ? (
                <button
                  onClick={handleUnfollow}
                  disabled={isFollowingLoading}
                  className={`flex-1 min-w-0 sm:flex-none font-semibold py-2.5 rounded-xl text-center sm:w-48 text-white bg-gray-600 dark:bg-[var(--dark-3)] ${
                    isFollowingLoading ? "opacity-50 cursor-wait" : "cursor-pointer"
                  }`}
                >
                  {isFollowingLoading ? "Loading..." : "Unfollow"}
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={isFollowingLoading}
                  className={`flex-1 min-w-0 sm:flex-none font-semibold py-2.5 rounded-xl text-center sm:w-48 text-white ${
                    isFollowingLoading ? "opacity-50 cursor-wait" : "cursor-pointer"
                  }`}
                  style={{ backgroundColor: accent.primary }}
                >
                  {isFollowingLoading ? "Loading..." : "Follow"}
                </button>
              )}

              <button
                onClick={() => setShowShare(true)}
                className={
                  profileUser.masteryTitle === "Rookie"
                    ? "flex-1 min-w-0 sm:flex-none cursor-pointer font-semibold bg-black/70 hover:bg-black text-white text-center py-2.5 rounded-xl sm:w-48 dark:hover:bg-gray-100 dark:bg-white dark:text-black"
                    : "flex-1 min-w-0 sm:flex-none cursor-pointer font-semibold text-center py-2.5 rounded-xl sm:w-48"
                }
                style={
                  profileUser.masteryTitle === "Rookie"
                    ? undefined
                    : {
                        backgroundColor: hexToRgbaUtil(accent.primary, 0.15),
                        color: accent.primary,
                      }
                }
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
                  color={accent.primary}
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
              <div className="w-full bg-white dark:bg-dark-2 rounded-xl border border-gray-200 dark:border-[var(--border)] p-6">
                <div className="mx-auto w-full max-w-[280px] h-72">
                  <RadarChart
                    data={radarData}
                    masteryTitle={profileUser.masteryTitle}
                    username={profileUser.username}
                    comparisonMode={true}
                    comparisonUsername={profileUser.username}
                    color={accent.primary}
                  />
                </div>
              </div>
            </div>}

            {/* STREAK, LIFE LEVEL, XP CARDS */}
            <div className="my-4 flex flex-col sm:flex-row justify-between text-sm gap-4">
              {/* Streak count */}
              {(() => {
                const streakTileClass = "bg-white dark:bg-dark-2 border rounded-2xl border-gray-200 dark:border-[var(--border)] w-full flex flex-col items-center justify-between p-4";
                const streakTileBody = (<>
                          <p className="text-sm dark:text-[var(--muted)]">Streak Count</p>

                          <p className="text-lg font-semibold flex gap-1 items-center">
                            <StreakCount count={(profileUser.streak_count ?? 0)} active={!!profileUser.streak_active} />
                          </p>
                </>);
                return me?.username === profileUser.username ? (
                  <Link href="/streaks" aria-label="Open streaks" className={`${streakTileClass} transition hover:brightness-110`} style={streakTileStyle(profileUser.streak_count ?? 0, !!profileUser.streak_active)}>{streakTileBody}</Link>
                ) : (
                  <div className={streakTileClass} style={streakTileStyle(profileUser.streak_count ?? 0, !!profileUser.streak_active)}>{streakTileBody}</div>
                );
              })()}

              {/* life level */}
              <div className="bg-white dark:bg-dark-2 border rounded-2xl border-gray-200 dark:border-[var(--border)] w-full flex flex-col items-center justify-between p-4">
                <span className="flex items-center justify-center gap-1">
                  <p className="text-gray-600 dark:text-[var(--foreground)] text-base sm:text-lg font-semibold">
                    Life Level {profileUser.lifeLevel}
                  </p>
                </span>
                <span className="flex items-center justify-center gap-1">
                  <p
                    style={{ fontSize: "11px" }}
                    className="text-gray-500 dark:text-[var(--muted)]"
                  >
                    {memberSinceDate
                      ? `Member since ${memberSinceDate}`
                      : "Member since date unavailable"}
                  </p>
                </span>
              </div>

              {/* XP — Rookie keeps the muted "locked" look (padlock, gray
                  background, gray border); any unlocked mastery gets the
                  aspect color as both border and a 50%-opacity fill. */}
              <div
                className={`rounded-2xl border w-full flex flex-col items-center justify-between p-4 ${
                  profileUser.masteryTitle === "Rookie"
                    ? "bg-gray-200 dark:bg-dark-2 border-gray-200 dark:border-[var(--border)]"
                    : ""
                }`}
                style={
                  profileUser.masteryTitle === "Rookie"
                    ? undefined
                    : {
                        backgroundColor: hexToRgbaUtil(accent.primary, 0.10),
                        borderColor: accent.primary,
                      }
                }
              >
                <span className="flex items-center justify-center gap-1">
                  <p
                    style={{ color: accent.text }}
                    className="text-lg font-semibold"
                  >
                    {profileUser.totalXP.toLocaleString()} XP
                  </p>
                </span>
                <span className="flex items-center justify-center gap-1">
                  {profileUser.masteryTitle === "Rookie" && (
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
                  )}
                  <p
                    style={
                      profileUser.masteryTitle === "Rookie"
                        ? { fontSize: "11px" }
                        : { fontSize: "11px", color: accent.primary, opacity: 0.5 }
                    }
                    className={
                      profileUser.masteryTitle === "Rookie"
                        ? "text-gray-400 dark:text-[var(--muted)]"
                        : undefined
                    }
                  >
                    {profileUser.masteryTitle === "Rookie"
                      ? profileUser.xp_to_next_master_level
                        ? `${profileUser.xp_to_next_master_level.toLocaleString()} XP to next mastery`
                        : "Mastery progress"
                      : profileUser.xp_to_next_master_level
                        ? `${Math.max(0, profileUser.xp_to_next_master_level - profileUser.totalXP).toLocaleString()} to ${profileUser.masteryTitle} ${toRoman(profileUser.masteryLevel + 1)}`
                        : `To ${profileUser.masteryTitle} ${toRoman(profileUser.masteryLevel + 1)}`}
                  </p>
                </span>
              </div>
            </div>

            {/* WEEKLY XP CHART */}
            {weeklyXPLoading ? (
              <div className="p-4 sm:p-6 my-4 bg-white dark:bg-dark-2 dark:border-[var(--border)] border border-gray-200 rounded-2xl w-full animate-pulse">
                <div className="flex justify-between items-center mb-4">
                  <span className="flex gap-3 items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-dark-3" />
                    <div className="h-4 w-40 rounded bg-gray-200 dark:bg-dark-3" />
                  </span>
                </div>
                <div className="relative h-48 sm:h-64 rounded-xl bg-gray-200 dark:bg-dark-3" />
              </div>
            ) : (
              <div className="p-4 sm:p-6 my-4 bg-white dark:bg-dark-2 dark:border-[var(--border)] border border-gray-200 rounded-2xl w-full animate-content-in">
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
                      <span className="text-white text-sm font-semibold">
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
                  compactMargins={isMobileViewport}
                />
              </div>
              </div>
            )}

            {/* TOP ACTIVITIES & RECENT SESSIONS */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="p-4 sm:p-6 my-2 bg-white border border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] rounded-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold dark:text-[var(--foreground)]">
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
              <div className="p-4 sm:p-6 my-2 bg-white border border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] rounded-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold dark:text-[var(--foreground)]">
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
                    // Show active session time; paused time is excluded.
                    const focusedSeconds =
                      session.focused_duration_seconds ?? 0;
                    const hours = Math.floor(focusedSeconds / 3600);
                    const minutes = Math.floor((focusedSeconds % 3600) / 60);
                    const duration =
                      hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

                    // Format timestamp
                    const timestamp = getTimeAgo(session.ended_at || session.started_at);

                    return (
                      <div
                        key={session.id || session.uid}
                        onClick={() => handleOpenSessionPopup(session)}
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

            {/* GOALS */}
            <div className="w-full pb-12 my-4">
              <h2 className="text-xl font-bold dark:text-[var(--foreground)] mb-3">
                Goals
              </h2>

              {postsLoading ? (
                <div className="flex flex-col gap-8 animate-pulse">
                  {/* Ongoing skeleton */}
                  <div>
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex h-32 rounded-2xl border border-gray-200 dark:border-[var(--border)] overflow-hidden bg-white dark:bg-dark-2">
                          <div className="w-24 sm:w-28 bg-gray-200 dark:bg-dark-3" />
                          <div className="flex-1 p-4 space-y-3">
                            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-dark-3" />
                            <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-dark-3" />
                            <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-dark-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Completed skeleton */}
                  <div>
                    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-52 rounded-2xl border border-gray-200 dark:border-[var(--border)] overflow-hidden bg-white dark:bg-dark-2">
                          <div className="h-20 bg-gray-200 dark:bg-dark-3" />
                          <div className="mx-auto -mt-8 h-16 w-16 rounded-full bg-gray-300 dark:bg-[var(--dark-3)]" />
                          <div className="mx-auto mt-3 h-3 w-2/3 rounded bg-gray-200 dark:bg-dark-3" />
                          <div className="mx-auto mt-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-dark-3" />
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
                            style={{ backgroundColor: myPrimaryColor }}
                            className="mt-5 flex items-center gap-2 rounded-2xl text-white font-semibold py-3 px-6 hover:opacity-90 transition cursor-pointer"
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

                  const toGoal = (post: UserPost): ProfileGoal => ({
                    uid: post.uid,
                    title: post.title,
                    emoji: post.emoji,
                    // Goals write user-entered text to `description`; `content`
                    // is a separate, usually-empty field on the same model
                    // (see Goal in main/models.py) — prefer whichever is set.
                    description: post.description || post.content,
                    coverImage: post.completion_picture_url || post.post_image_url || null,
                    totalXp: post.total_xp,
                    durationDisplay: post.duration_display,
                    xpDistribution: post.xp_distribution,
                    sessionsCount: post.sessions_count,
                    lastSessionAt: post.last_session_at,
                    createdAt: post.created_at,
                    completedAt: post.completion_date ?? post.updated_at,
                  });
                  return (
                    <div className="flex flex-col gap-10">
                      {ongoingPosts.length > 0 && (
                        <div>
                          <p className="text-base font-semibold text-black dark:text-[var(--foreground)] mb-3">
                            Ongoing{" "}
                            <span className="text-gray-500 dark:text-[var(--muted)]">{ongoingPosts.length}</span>
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
                            {ongoingPosts.map((post) => (
                              <Link key={post.id} href={`/goals/${post.uid}`}>
                                <OngoingGoalCard goal={toGoal(post)} />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {otherPosts.length > 0 && (
                        <div>
                          <p className="text-base font-semibold text-black dark:text-[var(--foreground)] mb-3">
                            Completed{" "}
                            <span className="text-gray-500 dark:text-[var(--muted)]">{otherPosts.length}</span>
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                            {otherPosts.map((post) => (
                              <Link key={post.id} href={`/goals/${post.uid}`}>
                                <CompletedGoalBadge goal={toGoal(post)} />
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

            {/* SESSIONS — the full history, paged; "This week" sits beside it */}
            {(() => {
              const pageSessions = sessionsPageData?.results ?? [];
              const totalPages = Math.max(1, Math.ceil((sessionsPageData?.count ?? 0) / SESSIONS_PAGE_SIZE));
              return (
                <div className="w-full pb-12 my-4">
                  <h2 className="text-xl font-bold dark:text-[var(--foreground)] mb-3">
                    Sessions
                  </h2>
                  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0">
                      {sessionsPageLoading ? (
                        <SessionTimelineSkeleton />
                      ) : pageSessions.length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-500 dark:text-[var(--muted)]">
                          No sessions yet
                        </p>
                      ) : (
                        <div className={sessionsPageFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
                          <SessionTimeline
                            sessions={pageSessions}
                            onSelectSession={handleOpenSessionPopup}
                            accentColor={accent.primary}
                            maxCardsPerDay={999}
                            onPage
                          />
                        </div>
                      )}
                      <div className="mt-6">
                        <Pagination
                          page={sessionsPage}
                          totalPages={totalPages}
                          onChange={setSessionsPage}
                          color={accent.primary}
                          disabled={sessionsPageFetching}
                        />
                      </div>
                    </div>
                    <aside className="order-first rounded-2xl border border-gray-200 bg-white p-4 dark:border-[var(--border)] dark:bg-dark-2 sm:p-6 lg:order-none">
                      <WeekSummary
                        days={groupSessionsByDay(weekSessions)}
                        weekStart={weekStart}
                        color={accent.primary}
                      />
                    </aside>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </main>
  );
}
