"use client";

import LeaderboardSwitcher from "@/src/components/LeaderboardSwitcher";
import {
  getMasteryLeaderboard,
  MASTERY_PAGE_SIZE,
  MASTERY_TYPES,
  type MasteryInfo,
  type MasteryLeaderboardPlayer,
} from "@/src/lib/mock/goalLeaderboardData";
import {
  ChevronDownIcon,
  FireIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
        className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: `linear-gradient(135deg, #FFD700, #FFA500)` }}
      >
        <CrownIcon color="#fff" />
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
        style={{ background: `linear-gradient(135deg, #E8E8E8, #B8B8B8)` }}
      >
        <span className="text-white font-bold text-sm">2</span>
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
        style={{ background: `linear-gradient(135deg, #CD7F32, #8B4513)` }}
      >
        <span className="text-white font-bold text-sm">3</span>
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
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M7.05 3.5L4 6.5v4.5l-2.5 2.5 2 2 2.5-2.5h4.5l3-3.05L12 8.45l-1.5 1.5-1.95-1.95 1.5-1.5-1.5-1.5-1.5 1.5-1.95-1.95 1.5-1.5L5.1 3.5h1.95M19 3l-6.5 6.5 2 2L21 5v-.5L19.5 3H19M3 19l2 2 7-7-2-2-7 7z" />
      </svg>
    ),
    protagonist: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M12 7a5 5 0 1 1-4.995 5.217L7 12l.005-.217A5 5 0 0 1 12 7zm0 2a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9zm0-7l2.5 3h-5L12 2zm0 18l-2.5-3h5L12 22zM2 12l3-2.5v5L2 12zm20 0l-3 2.5v-5L22 12z" />
      </svg>
    ),
    prodigy: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M12 3c.5 0 1 .19 1.41.59l2 2c.4.4.59.9.59 1.41v1h3c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-9c0-1.1.9-2 2-2h3V7c0-.5.19-1 .59-1.41l2-2c.4-.4.9-.59 1.41-.59zm0 2l-2 2v1h4V7l-2-2zm-4 6v2h3v-2H8zm5 0v2h3v-2h-3zm-5 4v2h3v-2H8zm5 0v2h3v-2h-3z" />
      </svg>
    ),
    alchemist: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d="M5 19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1c0-.21-.07-.41-.18-.57L13 8.35V4h-2v4.35L5.18 18.43c-.11.16-.18.36-.18.57zm1-16h12v2H6V3zm2.1 14h7.8L12 10.85 8.1 17z" />
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

  const [players, setPlayers] = useState<MasteryLeaderboardPlayer[]>([]);
  const [currentMastery, setCurrentMastery] = useState<MasteryInfo | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentUser = useMemo(
    () => ({
      username: "pat",
      fullname: "Patty",
      profile_picture:
        "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1752327292/lfco9m4hqq9yin7adl6e.jpg",
      lifeLevel: 4,
      posts: 9,
      followers: 11,
      following: 45,
      xp: 972,
      streak: 0,
      streak_active: false,
      masteryTitle: "Rookie",
    }),
    []
  );

  const loadPage = useCallback(
    (page: number, search: string = "") => {
      setLoading(true);

      setTimeout(() => {
        const response = getMasteryLeaderboard({
          masteryId,
          page,
          pageSize: MASTERY_PAGE_SIZE,
          search,
        });

        if (response.success) {
          setPlayers(response.players);
          setCurrentMastery(response.mastery);
          setCurrentPage(response.pagination.current_page);
          setTotalPages(response.pagination.total_pages);
          setTotalPlayers(response.pagination.total_players);
        }
        setLoading(false);
      }, 250);
    },
    [masteryId]
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
      <div className="w-full md:w-[calc(100%-450px)] relative flex-1 overflow-y-auto">
        {/* Hero Header Banner */}
        {currentMastery && (
          <div
            className="relative overflow-visible"
            style={{
              background: `linear-gradient(135deg, ${currentMastery.color}20 0%, ${currentMastery.color}05 100%)`,
            }}
          >
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
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
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
                    <div className="absolute top-[calc(100%+8px)] left-0 w-80 bg-white dark:bg-dark-2 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">
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
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                                  isActive
                                    ? "shadow-md"
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
              <div className="flex gap-6 mt-6">
                <div
                  className="px-4 py-2 rounded-xl"
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
                  className="px-4 py-2 rounded-xl"
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
        )}

        {/* Content area */}
        <div className="px-4 md:px-12 py-6">
          {/* Search bar */}
          <div className="mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-dark-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all shadow-sm"
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
                  href={`/user/${u.username}`}
                  className="block mb-1"
                >
                  <div
                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all bg-white dark:bg-dark-2 ${
                      isFirst
                        ? "shadow-lg border-2"
                        : isTopThree
                        ? "shadow-md border"
                        : "hover:shadow-md border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                    }`}
                    style={
                      isFirst && currentMastery
                        ? {
                            background: `linear-gradient(135deg, ${currentMastery.color}08, white)`,
                            borderColor: `${currentMastery.color}40`,
                          }
                        : isTopThree
                        ? {
                            borderColor: "#e5e7eb",
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
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold truncate dark:text-white ${
                          isFirst ? "text-lg" : ""
                        }`}
                      >
                        {u.fullname}
                      </p>
                      {isTopThree && currentMastery && (
                        <p
                          className="text-xs"
                          style={{ color: currentMastery.color }}
                        >
                          Top {u.rank} {currentMastery.name}
                        </p>
                      )}
                    </div>

                    {/* XP */}
                    <div className="text-right">
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

      {/* Sidebar (Desktop) */}
      <aside className="w-[450px] p-6 overflow-auto hidden md:block h-screen bg-gray-50 dark:bg-dark-1">
        {/* Mastery card */}
        {currentMastery && (
          <div
            className="p-6 mb-4 rounded-2xl shadow-lg overflow-hidden relative"
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
        <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-2xl shadow-sm">
          <div className="text-center flex flex-col items-center">
            <Link href={`/user/${currentUser.username}`}>
              <img
                src={currentUser.profile_picture}
                className="h-20 w-20 object-cover aspect-square rounded-full ring-4 ring-gray-100 dark:ring-gray-800"
                alt={currentUser.fullname}
              />
              <h3 className="font-semibold mt-3 text-lg dark:text-white">
                {currentUser.fullname}
              </h3>
            </Link>
            <p className="text-sm font-medium mt-1 text-gray-400">
              {currentUser.masteryTitle}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-dark-3">
              <p className="font-bold dark:text-white">
                {currentUser.lifeLevel}
              </p>
              <p className="text-xs text-gray-500">Level</p>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-dark-3">
              <p className="font-bold dark:text-white">{currentUser.posts}</p>
              <p className="text-xs text-gray-500">Posts</p>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-dark-3">
              <p className="font-bold dark:text-white">
                {currentUser.followers}
              </p>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-dark-3">
              <p className="font-bold dark:text-white">
                {currentUser.following}
              </p>
              <p className="text-xs text-gray-500">Following</p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <div className="flex-1 p-4 rounded-xl bg-gray-50 dark:bg-dark-3 text-center">
              <p className="text-xl font-bold text-gray-400">
                {currentUser.xp} XP
              </p>
              <p className="text-xs text-gray-500 mt-1">Mastery at 10K</p>
            </div>
            <div className="flex-1 p-4 rounded-xl bg-gray-50 dark:bg-dark-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <FireIcon
                  className={`w-6 h-6 ${
                    currentUser.streak_active
                      ? "text-orange-500"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
                <span className="text-xl font-bold text-gray-400">
                  {currentUser.streak}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Streak</p>
            </div>
          </div>
        </div>

        {/* Other leaderboards */}
        <LeaderboardSwitcher currentLeaderboard={masteryId} />
      </aside>
    </main>
  );
}
