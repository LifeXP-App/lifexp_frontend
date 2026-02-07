"use client";

import LeaderboardSwitcher from "@/src/components/LeaderboardSwitcher";
import { useAuth } from "@/src/context/AuthContext";
import {
  MASTERY_TYPES,
  type MasteryInfo,
} from "@/src/lib/mock/goalLeaderboardData";
import {
  ChevronDownIcon,
  FireIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type MasteryLeaderboardPlayer = {
  rank: number;
  username: string;
  fullname: string;
  profile_picture: string;
  xp: number;
  is_current_user: boolean;
  user_id: number;
  lifelevel: number;
  activity_name: string;
  masterylevel: string;
  today: number;
  status: string | null;
};

type PaginationInfo = {
  has_next: boolean;
  has_previous: boolean;
  current_page: number;
  total_pages: number;
  total_count: number;
};

type LeaderboardResponse = {
  success: boolean;
  players: MasteryLeaderboardPlayer[];
  pagination: PaginationInfo;
};

type UserApiResponse = {
  id: number;
  fullname: string;
  username: string;
  avatar: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  totalXP: number;
  lifeLevel: number;
  masteryTitle: string;
};

// Skeleton loading components
function PlayerRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-dark-2 border border-gray-100 dark:border-gray-800 animate-pulse mb-1">
      {/* Rank */}
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />

      {/* Avatar */}
      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />

      {/* Name */}
      <div className="flex-1">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* XP */}
      <div className="text-right">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
        <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded ml-auto" />
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="w-full md:w-[calc(100%-450px)] relative flex-1 overflow-y-auto bg-gray-50 dark:bg-dark-1">
      <div className="relative overflow-visible">
        <div className="relative px-4 md:px-12 py-8 animate-pulse">
          {/* Icon and title skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700" />
            <div>
              <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="flex gap-6">
            <div className="w-36 h-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="w-36 h-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>

      {/* Content area skeleton */}
      <div className="px-4 md:px-12 py-2">
        {/* Search bar skeleton */}
        <div className="mb-6">
          <div className="w-full h-12 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Player rows skeleton */}
        <div className="space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <PlayerRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Crown SVG for 1st place
function CrownIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill={color}>
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  );
}

// Medal component for top 3
function RankBadge({ rank, color }: { rank: number; color: string }) {
  if (rank === 1) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center "
        style={{ background: `linear-gradient(135deg, #FFD700, #FFA500)` }}
      >
        <CrownIcon color="#00000030" />
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, #E8E8E8, #B8B8B8)` }}
      >
        <CrownIcon color="#00000030" />
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, #CD7F32, #8B4513)` }}
      >
        <CrownIcon color="#00000030" />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 flex items-center justify-center">
      <span className="text-gray-500 dark:text-gray-400 font-semibold">
        {rank}
      </span>
    </div>
  );
}

// Mastery icon SVGs
function MasteryIcon({
  type,
  className,
  style,
}: {
  type: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const icons: Record<string, React.ReactNode> = {
    warrior: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 512"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M96 112c0-26.5 21.5-48 48-48s48 21.5 48 48l0 112 256 0 0-112c0-26.5 21.5-48 48-48s48 21.5 48 48l0 16 16 0c26.5 0 48 21.5 48 48l0 48c17.7 0 32 14.3 32 32s-14.3 32-32 32l0 48c0 26.5-21.5 48-48 48l-16 0 0 16c0 26.5-21.5 48-48 48s-48-21.5-48-48l0-112-256 0 0 112c0 26.5-21.5 48-48 48s-48-21.5-48-48l0-16-16 0c-26.5 0-48-21.5-48-48l0-48c-17.7 0-32-14.3-32-32s14.3-32 32-32l0-48c0-26.5 21.5-48 48-48l16 0 0-16z" />
      </svg>
    ),
    protagonist: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 448 512"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M338.8-9.9c11.9 8.6 16.3 24.2 10.9 37.8L271.3 224 416 224c13.5 0 25.5 8.4 30.1 21.1s.7 26.9-9.6 35.5l-288 240c-11.3 9.4-27.4 9.9-39.3 1.3s-16.3-24.2-10.9-37.8L176.7 288 32 288c-13.5 0-25.5-8.4-30.1-21.1s-.7-26.9 9.6-35.5l288-240c11.3-9.4 27.4-9.9 39.3-1.3z" />
      </svg>
    ),
    prodigy: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 512"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M246.9 18.3L271 3.8c21.6-13 46.3-19.8 71.5-19.8 36.8 0 72.2 14.6 98.2 40.7l63.9 63.9c15 15 23.4 35.4 23.4 56.6l0 30.9 19.7 19.7 0 0c15.6-15.6 40.9-15.6 56.6 0s15.6 40.9 0 56.6l-64 64c-15.6 15.6-40.9 15.6-56.6 0s-15.6-40.9 0-56.6L464 240 433.1 240c-21.2 0-41.6-8.4-56.6-23.4l-49.1-49.1c-15-15-23.4-35.4-23.4-56.6l0-12.7c0-11.2-5.9-21.7-15.5-27.4l-41.6-25c-10.4-6.2-10.4-21.2 0-27.4zM50.7 402.7l222.1-222.1 90.5 90.5-222.1 222.1c-25 25-65.5 25-90.5 0s-25-65.5 0-90.5z" />
      </svg>
    ),
    alchemist: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M120 56c0-30.9 25.1-56 56-56l24 0c17.7 0 32 14.3 32 32l0 448c0 17.7-14.3 32-32 32l-32 0c-29.8 0-54.9-20.4-62-48-.7 0-1.3 0-2 0-44.2 0-80-35.8-80-80 0-18 6-34.6 16-48-19.4-14.6-32-37.8-32-64 0-30.9 17.6-57.8 43.2-71.1-7.1-12-11.2-26-11.2-40.9 0-44.2 35.8-80 80-80l0-24zm272 0l0 24c44.2 0 80 35.8 80 80 0 15-4.1 29-11.2 40.9 25.7 13.3 43.2 40.1 43.2 71.1 0 26.2-12.6 49.4-32 64 10 13.4 16 30 16 48 0 44.2-35.8 80-80 80-.7 0-1.3 0-2 0-7.1 27.6-32.2 48-62 48l-32 0c-17.7 0-32-14.3-32-32l0-448c0-17.7 14.3-32 32-32l24 0c30.9 0 56 25.1 56 56z" />
      </svg>
    ),
    diplomat: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M12 5.5A3.5 3.5 0 0 1 15.5 9a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 8.5 9 3.5 3.5 0 0 1 12 5.5M5 8c.56 0 1.08.15 1.53.42-.15 1.43.27 2.85 1.13 3.96C7.16 13.34 6.16 14 5 14a3 3 0 0 1-3-3 3 3 0 0 1 3-3m14 0a3 3 0 0 1 3 3 3 3 0 0 1-3 3c-1.16 0-2.16-.66-2.66-1.62a5.54 5.54 0 0 0 1.13-3.96c.45-.27.97-.42 1.53-.42M5.5 18.25c0-2.07 2.91-3.75 6.5-3.75s6.5 1.68 6.5 3.75V20h-13v-1.75M0 20v-1.5c0-1.39 1.89-2.56 4.45-2.9-.59.68-.95 1.62-.95 2.65V20H0m24 0h-3.5v-1.75c0-1.03-.36-1.97-.95-2.65 2.56.34 4.45 1.51 4.45 2.9V20z" />
      </svg>
    ),
  };

  return <>{icons[type] || null}</>;
}

export default function MasteryLeaderboard() {
  const params = useParams();
  const masteryId = params.goalId as string;
  const { me } = useAuth();

  const [players, setPlayers] = useState<MasteryLeaderboardPlayer[]>([]);
  const [currentMastery, setCurrentMastery] = useState<MasteryInfo | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState<UserApiResponse | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  const currentUser = useMemo(() => {
    if (!userData) return null;

    return {
      username: userData.username,
      fullname: userData.fullname,
      profile_picture:
        userData.avatar ||
        "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
      lifeLevel: userData.lifeLevel,
      posts: userData.posts_count,
      followers: userData.followers_count,
      following: userData.following_count,
      xp: userData.totalXP,
      streak: 0,
      streak_active: false,
      masteryTitle: userData.masteryTitle,
    };
  }, [userData]);

  // Fetch user data for sidebar
  useEffect(() => {
    const fetchUser = async () => {
      if (!me?.username) return;

      setUserLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseUrl) return;

        const res = await fetch(`${baseUrl}/api/v1/users/${me.username}/`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          setUserData(null);
          return;
        }

        const data = await res.json();
        setUserData(data);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setUserData(null);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, [me?.username]);

  const loadPage = useCallback(
    async (page: number, search: string = "") => {
      setLoading(true);

      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          ...(search && { search }),
        });

        const res = await fetch(
          `/api/leaderboard/${masteryId}?${queryParams.toString()}`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch leaderboard");
        }

        const response: LeaderboardResponse = await res.json();

        if (response.success) {
          // Optimize profile picture URLs
          const optimizedPlayers = response.players.map((player) => ({
            ...player,
            profile_picture: player.profile_picture?.includes("cloudinary")
              ? player.profile_picture.replace(
                  "/upload/",
                  "/upload/w_100,q_auto,f_auto/",
                )
              : player.profile_picture,
          }));

          setPlayers(optimizedPlayers);

          // Find mastery info from MASTERY_TYPES
          const masteryInfo = MASTERY_TYPES.find((m) => m.id === masteryId);
          if (masteryInfo) {
            setCurrentMastery(masteryInfo);
          }

          setCurrentPage(response.pagination.current_page);
          setTotalPages(response.pagination.total_pages);
          setTotalPlayers(response.pagination.total_count);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    },
    [masteryId],
  );

  useEffect(() => {
    loadPage(1, searchTerm);
  }, [masteryId, loadPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPage(1, searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, loadPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <main className="flex w-full min-h-screen">
      {/* Main leaderboard list */}
      {/* Show skeleton while loading initial data */}
      {!currentMastery ? (
        <HeaderSkeleton />
      ) : (
        <div
          className="w-full md:w-[calc(100%-450px)] relative flex-1 overflow-y-auto"
          style={{
            background: `linear-gradient(135deg, ${currentMastery.color}20 0%, ${currentMastery.color}05 100%)`,
          }}
        >
          <div className="relative overflow-visible">
            {/* Decorative background pattern */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `radial-gradient(${currentMastery.color} 1px, transparent 1px)`,
                backgroundSize: "20px 20px",
              }}
            />

            <div className="relative px-4 md:px-12 py-8">
              {/* Dropdown trigger */}
              <div className="relative inline-block">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-4 cursor-pointer group"
                >
                  {/* Mastery Icon */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center "
                    style={{
                      background: `linear-gradient(135deg, ${currentMastery.color}, ${currentMastery.color}CC)`,
                    }}
                  >
                    <MasteryIcon
                      type={currentMastery.id}
                      className="w-8 h-8 text-white"
                    />
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl md:text-3xl font-bold dark:text-white">
                        {currentMastery.name}
                      </h1>
                      <ChevronDownIcon
                        className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform group-hover:text-gray-700 dark:group-hover:text-gray-300 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: currentMastery.color }}
                    >
                      {currentMastery.aspect} Leaderboard
                    </p>
                  </div>
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute top-[calc(100%+8px)] left-0 w-80 bg-white dark:bg-dark-2 border border-gray-200 dark:border-gray-700 rounded-2xl z-50 overflow-hidden">
                      <div className="p-2">
                        {MASTERY_TYPES.map((mastery) => {
                          const isActive = mastery.id === masteryId;

                          return (
                            <Link
                              key={mastery.id}
                              href={`/leaderboard/goals/${mastery.id}`}
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <div
                                className={`flex items-center gap-3 px-4 py-3 rounded-r-xl cursor-pointer transition-all ${
                                  isActive
                                    ? ""
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                                style={
                                  isActive
                                    ? {
                                        background: `linear-gradient(135deg, ${mastery.color}15, ${mastery.color}05)`,
                                        borderLeft: `4px solid ${mastery.color}`,
                                      }
                                    : undefined
                                }
                              >
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                                  style={{
                                    background: isActive
                                      ? `linear-gradient(135deg, ${mastery.color}, ${mastery.color}CC)`
                                      : `${mastery.color}20`,
                                  }}
                                >
                                  <MasteryIcon
                                    type={mastery.id}
                                    className={`w-5 h-5 ${
                                      isActive ? "text-white" : ""
                                    }`}
                                    style={{
                                      color: isActive ? "#fff" : mastery.color,
                                    }}
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {mastery.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {mastery.aspect} • {mastery.playerCount}{" "}
                                    players
                                  </p>
                                </div>
                                {isActive && (
                                  <div
                                    className="w-2 h-2 rounded-full animate-pulse"
                                    style={{ backgroundColor: mastery.color }}
                                  />
                                )}
                              </div>
                            </Link>
                          );
                        })}

                        {/* Rookie Leaderboard */}
                        <Link
                          href="/leaderboard/rookie"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: "#64748b20" }}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-5 h-5"
                                style={{ color: "#64748b" }}
                              >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                Rookie
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                All Aspects • New Players
                              </p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Stats row */}
              <div className="flex gap-6 mt-6 ">
                <div
                  className="px-4 py-2 rounded-xl flex flex-col w-36 items-center justify-center"
                  style={{ backgroundColor: `${currentMastery.color}15` }}
                >
                  <p
                    className="text-2xl font-bold"
                    style={{ color: currentMastery.color }}
                  >
                    {totalPlayers}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Players
                  </p>
                </div>
                <div
                  className="px-4 py-2 rounded-xl flex flex-col w-36 items-center justify-center"
                  style={{ backgroundColor: `${currentMastery.color}15` }}
                >
                  <p
                    className="text-2xl font-bold"
                    style={{ color: currentMastery.color }}
                  >
                    {currentMastery.playerCount}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total {currentMastery.name}s
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="px-4 md:px-12 py-2">
            {/* Search bar */}
            <div className="mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-dark-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none  transition-all "
                  style={
                    {
                      focusRing: currentMastery?.color,
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>

            {/* Players list */}
            <div
              className={`transition-opacity ${
                loading ? "opacity-50" : "opacity-100"
              }`}
            >
              {players.map((u, index) => {
                const isTopThree = u.rank <= 3;
                const isFirst = u.rank === 1;

                return (
                  <Link
                    key={u.username}
                    href={`/u/${u.username}`}
                    className="block mb-1"
                  >
                    <div
                      className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all bg-white dark:bg-dark-2 ${
                        isTopThree
                          ? "border"
                          : "border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                      }`}
                      style={
                        isTopThree
                          ? {
                              borderColor: "#66666680",
                            }
                          : undefined
                      }
                    >
                      {/* Rank badge */}
                      <RankBadge
                        rank={u.rank}
                        color={currentMastery?.color || "#666"}
                      />

                      {/* Profile picture with ring for top 3 */}
                      <div className="relative">
                        <img
                          className="h-12 w-12 rounded-full object-cover aspect-square"
                          style={
                            isTopThree && currentMastery
                              ? {
                                  boxShadow: `0 0 0 2px white, 0 0 0 4px ${currentMastery.color}`,
                                }
                              : undefined
                          }
                          src={u.profile_picture}
                          alt={u.fullname}
                        />
                        {isFirst && currentMastery && (
                          <div
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: currentMastery.color }}
                          >
                            <CrownIcon color="#fff" />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0 ">
                        <p
                          className={`font-semibold truncate dark:text-white ${
                            isFirst ? "text-lg" : ""
                          }`}
                        >
                          {u.fullname}
                        </p>
                        {isTopThree && currentMastery && (
                          <p
                            className="text-xs font-bold mt-1"
                            style={{ color: currentMastery.color }}
                          >
                            Top {u.rank} {currentMastery.name}
                          </p>
                        )}
                      </div>

                      {/* XP */}
                      <div className="text-right flex items-center gap-2">
                        <p
                          className={`font-bold ${
                            isFirst ? "text-xl" : "text-lg"
                          }`}
                          style={
                            isTopThree && currentMastery
                              ? { color: currentMastery.color }
                              : { color: "#6b7280" }
                          }
                        >
                          {u.xp}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          XP
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {!loading && players.length === 0 && (
                <div className="text-center py-16">
                  <div
                    className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${currentMastery?.color}10` }}
                  >
                    {currentMastery && (
                      <MasteryIcon
                        type={currentMastery.id}
                        className="w-12 h-12"
                        style={{ color: `${currentMastery.color}40` }}
                      />
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    {searchTerm
                      ? "No players found matching your search"
                      : `No ${currentMastery?.name}s on the leaderboard yet`}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Be the first to claim the top spot!
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                <button
                  onClick={() => loadPage(currentPage - 1, searchTerm)}
                  disabled={currentPage <= 1 || loading}
                  className="px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: currentMastery
                      ? `${currentMastery.color}15`
                      : "#f3f4f6",
                    color: currentMastery?.color || "#374151",
                  }}
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                    style={{
                      backgroundColor: currentMastery?.color || "#3b82f6",
                    }}
                  >
                    {currentPage}
                  </span>
                  <span className="text-gray-400">of</span>
                  <span className="font-medium dark:text-white">
                    {totalPages}
                  </span>
                </div>

                <button
                  onClick={() => loadPage(currentPage + 1, searchTerm)}
                  disabled={currentPage >= totalPages || loading}
                  className="px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: currentMastery
                      ? `${currentMastery.color}15`
                      : "#f3f4f6",
                    color: currentMastery?.color || "#374151",
                  }}
                >
                  Next
                </button>
              </div>
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div
                  className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent"
                  style={{
                    borderColor: `${currentMastery?.color}40`,
                    borderTopColor: "transparent",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar (Desktop) */}
      <aside className="w-[450px] p-6 overflow-auto hidden md:block h-screen bg-gray-50 dark:bg-dark-1">
        {/* Mastery card */}
        {currentMastery && (
          <div
            className="p-6 mb-4 rounded-2xl overflow-hidden relative"
            style={{
              background: `linear-gradient(135deg, ${currentMastery.color}, ${currentMastery.color}DD)`,
            }}
          >
            {/* Decorative circles */}
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
              style={{ backgroundColor: "#fff" }}
            />
            <div
              className="absolute -bottom-5 -left-5 w-20 h-20 rounded-full opacity-10"
              style={{ backgroundColor: "#fff" }}
            />

            <div className="relative text-center text-white">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <MasteryIcon
                  type={currentMastery.id}
                  className="w-10 h-10 text-white"
                />
              </div>
              <h3 className="font-bold text-2xl">{currentMastery.name}</h3>
              <p className="text-white/80 mt-1">
                {currentMastery.aspect} Masters
              </p>

              <div className="flex justify-center gap-8 mt-6">
                <div>
                  <p className="text-3xl font-bold">{totalPlayers}</p>
                  <p className="text-white/70 text-sm">Ranked</p>
                </div>
                <div className="w-px bg-white/30" />
                <div>
                  <p className="text-3xl font-bold">
                    {currentMastery.playerCount}
                  </p>
                  <p className="text-white/70 text-sm">Total</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User profile card */}
        {currentUser ? (
          <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-center flex flex-col items-center">
              <Link href={`/u/${currentUser.username}`}>
                <img
                  src={currentUser.profile_picture}
                  className="h-24 w-24 object-cover aspect-square p-[1.5px] rounded-full"
                  alt={currentUser.fullname}
                />
                <h3 className="font-semibold mt-2 dark:text-white">
                  {currentUser.fullname}
                </h3>
              </Link>

              <p className="text-sm font-bold mt-1 text-gray-400 dark:text-gray-500">
                {currentUser.masteryTitle}
              </p>
            </div>

            <div className="mt-4 flex justify-between text-sm">
              <div className="text-center">
                <p className="font-semibold dark:text-white">
                  {currentUser.lifeLevel}
                </p>
                <p className="text-gray-500 dark:text-gray-400">Life Level</p>
              </div>
              <div className="text-center">
                <p className="font-semibold dark:text-white">
                  {currentUser.posts}
                </p>
                <p className="text-gray-500 dark:text-gray-400">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-semibold dark:text-white">
                  {currentUser.followers}
                </p>
                <p className="text-gray-500 dark:text-gray-400">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-semibold dark:text-white">
                  {currentUser.following}
                </p>
                <p className="text-gray-500 dark:text-gray-400">Following</p>
              </div>
            </div>

            <div className="mt-4 flex justify-between text-sm gap-4">
              <div className="bg-gray-100 dark:bg-dark-3 w-full flex flex-col rounded-md items-center justify-between p-4">
                <p className="text-lg font-bold text-gray-400 dark:text-gray-500">
                  {currentUser.xp} XP
                </p>
                <p className="text-[10px] cursor-pointer text-gray-500 dark:text-gray-400">
                  Mastery unlocks at 10K
                </p>
              </div>

              <div className="bg-gray-100 w-full hidden md:flex flex-col rounded-md items-center justify-between p-4 dark:bg-dark-3">
                <p className="text-sm dark:text-gray-300">Streak Count</p>
                <p className="text-lg font-extrabold text-gray-400 dark:text-gray-600 flex gap-1 items-center">
                  {currentUser.streak_active ? (
                    <FireIcon className="w-6 h-6 inline-block ml-1 text-yellow-500 animate-pulse" />
                  ) : (
                    <FireIcon className="w-6 h-6 inline-block ml-1 text-gray-400 dark:text-gray-600" />
                  )}
                  {currentUser.streak}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse">
            <div className="text-center flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 mb-2" />
              <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        )}

        {/* Other leaderboards */}
        <LeaderboardSwitcher currentLeaderboard={masteryId} />
      </aside>
    </main>
  );
}
