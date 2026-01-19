"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {FireIcon} from "@heroicons/react/24/solid";
import {
  ROOKIE_LEADERBOARD_PLAYERS,
  ROOKIE_TOTAL_PAGES,
  ROOKIE_PAGE_SIZE,
} from "@/src/lib/mock/leaderboardData";

type Player = {
  username: string;
  fullname: string;
  xp: number;
  rank: number;
  profile_picture: string;
};
import { useParams } from "next/navigation";
import LeaderboardSwitcher from "@/src/components/LeaderboardSwitcher";

export default function RookieLeaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(ROOKIE_TOTAL_PAGES);
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const masteryId = params.goalId as string;

  // TODO: Replace with real current user data (session)
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

  function loadPage(page: number) {
    const safePage = Math.max(1, Math.min(page, totalPages));

    setLoading(true);

    // mimic network delay so spinner/opacity works like real API
    setTimeout(() => {
      const start = (safePage - 1) * ROOKIE_PAGE_SIZE;
      const end = start + ROOKIE_PAGE_SIZE;

      setPlayers(ROOKIE_LEADERBOARD_PLAYERS.slice(start, end));
      setCurrentPage(safePage);
      setLoading(false);
    }, 250);
  }

  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1)
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[17px] fill-[#D4AF37]"
          viewBox="0 0 576 512"
        >
          <path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6l277.2 0c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z" />
        </svg>
      );

    if (rank === 2)
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[17px] fill-[#C0C0C0]"
          viewBox="0 0 576 512"
        >
          <path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6l277.2 0c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z" />
        </svg>
      );

    if (rank === 3)
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[17px] fill-[#CD7F32]"
          viewBox="0 0 576 512"
        >
          <path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6l277.2 0c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z" />
        </svg>
      );

    return (
      <p className="w-[17px] text-sm font-semibold text-left text-gray-600 dark:text-gray-400">
        {rank}
      </p>
    );
  };

  return (
    <main className="flex w-full overflow-hidden h-screen bg-gray-50 dark:bg-dark-1">
      {/* Main leaderboard list */}
      <div className="w-full md:w-[calc(100%-450px)] relative noscrollbar flex-1 overflow-auto py-4 px-4 md:py-8 md:px-12">
        {/* Header with improved spacing and hierarchy */}
        <div className="flex justify-between items-center w-full mb-8">
          <h1 className="text-2xl font-bold dark:text-white">Rookies</h1>
          <span style={{backgroundColor: "rgba(var(--rookie-primary-rgb), 0.2)", color:"var(--rookie-primary)"}} className="text-sm font-semibold px-4 py-2 rounded-full bg-gray-200 dark:bg-dark-2 text-gray-700 dark:text-gray-300">
            0-9999 XP
          </span>
        </div>

        {/* Players list with improved card design */}
        <div
          id="users-container"
          className={`space-y-2 transition-opacity duration-200 ${
            loading ? "opacity-50 pointer-events-none" : "opacity-100"
          }`}
        >
          {players.map((u) => (
            <Link key={u.username} href={`/user/${u.username}`}>
              <div className="flex hover:bg-white dark:hover:bg-dark-2 cursor-pointer justify-between items-center w-full overflow-hidden px-5 py-4 rounded-xl transition-all duration-200 bg-white/50 dark:bg-dark-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 ">
                <div className="flex justify-start items-center flex-grow gap-4">
                  <div className="w-5 flex items-center justify-center">
                    <RankBadge rank={u.rank} />
                  </div>

                  <img
                    className="h-10 w-10 rounded-full object-cover aspect-square ring-2 ring-gray-100 dark:ring-gray-800"
                    src={u.profile_picture}
                    alt={u.fullname}
                  />
                  <p className="text-base font-semibold dark:text-white">{u.fullname}</p>
                </div>

                <div className="flex flex-col justify-center items-end">
                  <p className="text-base font-semibold dark:text-gray-200">{u.xp.toLocaleString()} XP</p>
                </div>
              </div>
            </Link>
          ))}

          {!loading && players.length === 0 && (
            <div className="text-center py-12 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-xl">
              <p className="text-lg font-semibold">Failed to load leaderboard data.</p>
            </div>
          )}
        </div>

        {/* Pagination with improved design */}
        <div className="flex justify-center items-center w-full gap-4 pt-8 pb-12">
          <button
            onClick={() => loadPage(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="px-5 py-2.5 bg-white dark:bg-dark-2 hover:bg-gray-50 dark:hover:bg-dark-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed dark:text-white font-medium transition-all border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow"
          >
            Previous
          </button>

          <div className="flex items-center gap-2 dark:text-white px-4 py-2 bg-white dark:bg-dark-2 rounded-xl border border-gray-200 dark:border-gray-800 min-w-[120px] justify-center">
            <span className="font-bold text-lg">{currentPage}</span>
            <span className="text-gray-500 dark:text-gray-400">of</span>
            <span className="font-semibold">{totalPages}</span>
          </div>

          <button
            onClick={() => loadPage(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            className="px-5 py-2.5 bg-white dark:bg-dark-2 hover:bg-gray-50 dark:hover:bg-dark-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed dark:text-white font-medium transition-all border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow"
          >
            Next
          </button>
        </div>

        {/* Loading indicator with better positioning */}
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <div className="bg-white dark:bg-dark-2 p-4 rounded-xl shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400" />
            </div>
          </div>
        )}
      </div>

      {/* Profile Widget (Desktop) */}
        <aside className="w-[450px] p-6 overflow-auto hidden md:block h-screen">
        <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="text-center flex flex-col items-center">
            <Link href={`/user/${currentUser.username}`}>
              <img
                src={currentUser.profile_picture}
                className="h-24 w-24 object-cover aspect-square p-[1.5px] rounded-full"
                alt={currentUser.fullname}
              />
              <h3 className="font-semibold mt-2 dark:text-white">{currentUser.fullname}</h3>
            </Link>

            <p className="text-sm font-bold mt-1 text-gray-400 dark:text-gray-500">
              {currentUser.masteryTitle}
            </p>
          </div>

          <div className="mt-4 flex justify-between text-sm">
            <div className="text-center">
              <p className="font-semibold dark:text-white">{currentUser.lifeLevel}</p>
              <p className="text-gray-500 dark:text-gray-400">Life Level</p>
            </div>
            <div className="text-center">
              <p className="font-semibold dark:text-white">{currentUser.posts}</p>
              <p className="text-gray-500 dark:text-gray-400">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-semibold dark:text-white">{currentUser.followers}</p>
              <p className="text-gray-500 dark:text-gray-400">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-semibold dark:text-white">{currentUser.following}</p>
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
              ) : 
              <FireIcon className="w-6 h-6 inline-block ml-1 text-gray-400 dark:text-gray-600" />}
               {currentUser.streak}
            </p>
          </div>
          </div>
        </div>

        {/* Banner Placeholder */}
        <LeaderboardSwitcher currentLeaderboard={masteryId} />
      </aside>
    </main>
  );
}