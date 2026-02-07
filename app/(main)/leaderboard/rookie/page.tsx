"use client";

import LeaderboardSwitcher from "@/src/components/LeaderboardSwitcher";
import { useAuth } from "@/src/context/AuthContext";
import { FireIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Player = {
  username: string;
  fullname: string;
  xp: number;
  rank: number;
  profile_picture: string;
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
  xp_to_next_life_level: number;
  xp_to_next_master_level: number;
  nextLevelXP: number;
  lifeLevel: number;
  masteryTitle: string;
};
function LeaderboardRowSkeleton() {
  return (
    <div className="flex justify-between items-center w-full px-5 py-4 rounded-xl bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-gray-900 animate-pulse">
      <div className="flex items-center gap-4">
        {/* rank */}
        <div className="w-5 flex justify-center">
          <div className="h-4 w-3 rounded bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* avatar */}
        <div className="h-10 w-10 rounded-full p-[1.5px] bg-gray-200 dark:bg-gray-800">
          <div className="h-full w-full rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* name + subtitle */}
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-20 rounded bg-gray-200/70 dark:bg-gray-800/70" />
        </div>
      </div>

      {/* XP block */}
      <div className="flex flex-col items-end gap-2">
        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3 w-12 rounded bg-gray-200/70 dark:bg-gray-800/70" />
      </div>
    </div>
  );
}

function RightSidebarInfoSkeleton() {
  return (
    <aside className="w-full hidden md:block">
      {/* PROFILE CARD */}
      <div className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900 animate-pulse">
        <div className="text-center flex flex-col items-center">
          {/* avatar */}
          <div className="h-24 w-24 aspect-square p-[1.5px] rounded-full bg-gray-200 dark:bg-gray-800 mb-3" />

          {/* fullname */}
          <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800 mb-3" />

          {/* mastery row */}
          <span className="flex gap-2 justify-center items-center">
            <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
            <span className="w-4" />
          </span>
        </div>

        {/* STATS */}
        <div className="mt-4 flex justify-between text-sm">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-4 w-6 mx-auto rounded bg-gray-200 dark:bg-gray-800 mb-2" />
              <div className="h-3 w-14 mx-auto rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>

        {/* XP BAR */}
        <div className="w-full relative rounded-full h-4 my-4 ml-1 overflow-hidden bg-gray-200 dark:bg-gray-800">
          <div className="h-6 w-[55%] bg-gray-300 dark:bg-gray-700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-20 rounded bg-gray-300/80 dark:bg-gray-700/70" />
          </div>
        </div>

        {/* XP + STREAK */}
        <div className="mt-4 flex justify-between text-sm gap-4">
          <div className="bg-gray-100 w-full flex flex-col rounded-md items-center justify-between p-4 dark:bg-gray-900 dark:bg-opacity-50">
            <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
            <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="bg-gray-100 w-full hidden md:flex flex-col rounded-md items-center justify-between p-4 dark:bg-gray-900 dark:bg-opacity-50">
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800 mb-2" />
            <div className="flex gap-2 items-center">
              <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-5 w-8 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      </div>

      {/* NEXT LEVEL TAB CARD */}
    </aside>
  );
}

export default function RookieLeaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const { me, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1); // API already returns full ranked list
  const [loading, setLoading] = useState(false);

  const [userData, setUserData] = useState<UserApiResponse | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  const params = useParams();
  const masteryId = params.goalId as string;

  // TODO: Replace with real session user

  async function loadPage(_: number) {
    setLoading(true);

    try {
      const res = await fetch("/api/xp/leaderboard", { cache: "no-store" });

      if (!res.ok) throw new Error("Failed to fetch leaderboard");

      const data = await res.json();

      const mapped: Player[] = data.leaderboard.map((u: any) => ({
        username: u.username,
        fullname: u.fullname,
        xp: u.total_xp,
        rank: u.rank,
        profile_picture: u.profile_picture.replace(
          "/upload/",
          `/upload/w_100,q_auto,f_auto/`,
        ),
      }));

      setPlayers(mapped);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage(1);
  }, []);

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
        console.error("Failed to fetch leaderboard sidebar user:", err);
        setUserData(null);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, [me?.username]);

  const currentUser = useMemo(() => {
    if (!userData) return null;

    const nextLevelXp =
      typeof userData.nextLevelXP === "number"
        ? userData.nextLevelXP
        : userData.xp_to_next_life_level || 0;

    const progressPercent =
      nextLevelXp > 0
        ? Math.min(100, (userData.totalXP / nextLevelXp) * 100)
        : 0;

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
  const showSidebarSkeleton =
    authLoading || userLoading || !me?.username || !currentUser;

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
      {/* Main leaderboard */}
      <div className="w-full md:w-[calc(100%-450px)] relative noscrollbar flex-1 overflow-auto py-4 px-4 md:py-8 md:px-12">
        <div className="flex justify-between items-center w-full mb-8">
          <h1 className="text-2xl font-bold dark:text-white">Rookies</h1>
          <span
            style={{
              backgroundColor: "rgba(var(--rookie-primary-rgb), 0.2)",
              color: "var(--rookie-primary)",
            }}
            className="text-sm font-semibold px-4 py-2 rounded-full"
          >
            0-9999 XP
          </span>
        </div>

        <div className={`space-y-2 transition-opacity duration-200`}>
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <LeaderboardRowSkeleton key={i} />
              ))
            : players.map((u) => (
                <Link key={u.username} href={`/u/${u.username}`}>
                  <div className="flex hover:bg-white dark:hover:bg-dark-2 cursor-pointer justify-between items-center w-full px-5 py-4 rounded-xl transition-all bg-white/50 dark:bg-dark-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-5 flex justify-center">
                        <RankBadge rank={u.rank} />
                      </div>

                      <img
                        src={u.profile_picture}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                        alt={u.fullname}
                      />

                      <p className="text-base font-semibold dark:text-white">
                        {u.fullname}
                      </p>
                    </div>

                    <p className="text-base font-semibold dark:text-gray-200">
                      {u.xp.toLocaleString()} XP
                    </p>
                  </div>
                </Link>
              ))}
        </div>
      </div>

      {/* Profile sidebar */}
      <aside className="w-[450px] p-6 overflow-auto hidden md:block h-screen">
        {showSidebarSkeleton ? (
          <RightSidebarInfoSkeleton />
        ) : (
          <div className="bg-white dark:bg-dark-2 p-6 rounded-xl border border-gray-200 dark:border-gray-800 mb-4">
            <div className="text-center flex flex-col items-center">
              <Link href={`/u/${currentUser.username}`}>
                <img
                  src={currentUser.profile_picture}
                  className="h-24 w-24 rounded-full object-cover"
                  alt={currentUser.fullname}
                />
                <h3 className="font-semibold mt-2 dark:text-white">
                  {currentUser.fullname}
                </h3>
              </Link>

              <p className="text-sm font-bold mt-1 text-gray-400">
                {currentUser.masteryTitle}
              </p>
            </div>

            <div className="mt-4 flex justify-between text-sm">
              <div className="text-center">
                <p className="font-semibold">{currentUser.lifeLevel}</p>
                <p className="text-gray-500">Life Level</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{currentUser.posts}</p>
                <p className="text-gray-500">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{currentUser.followers}</p>
                <p className="text-gray-500">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{currentUser.following}</p>
                <p className="text-gray-500">Following</p>
              </div>
            </div>

            <div className="mt-4 flex gap-4">
              <div className="bg-gray-100 dark:bg-dark-3 w-full rounded-md p-4 text-center">
                <p className="text-lg font-bold text-gray-400">
                  {currentUser.xp} XP
                </p>
                <p className="text-[10px] text-gray-500">
                  Mastery unlocks at 10K
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-dark-3 w-full rounded-md p-4 text-center">
                <p className="text-sm">Streak</p>
                <p className="text-lg font-extrabold  flex items-center justify-center gap-1 ">
                  <FireIcon
                    className={`w-6 h-6 ${
                      currentUser.streak_active
                        ? "text-yellow-500 animate-pulse"
                        : "text-gray-400"
                    }`}
                  />
                  <span
                    className={!currentUser.streak_active ? "opacity-40" : ""}
                  >
                    {currentUser.streak}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <LeaderboardSwitcher currentLeaderboard={masteryId} />
      </aside>
    </main>
  );
}
