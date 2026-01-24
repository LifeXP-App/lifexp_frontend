"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FireIcon } from "@heroicons/react/24/solid";
import { MASTERY_TYPES } from "@/src/lib/mock/goalLeaderboardData";



export default function MasteryLeaderboardIndex() {
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

  return (
    <main className="flex w-full">
      {/* Main content */}
      <div className="w-full md:w-[calc(100%-450px)] relative flex-1 overflow-y-auto py-2 px-4 md:py-8 md:px-12">
        <div className="mb-6">
          <h1 className="text-xl font-semibold dark:text-white">Mastery Leaderboards</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Compete with others who share your mastery path
          </p>
        </div>

        {/* Mastery types grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MASTERY_TYPES.map((mastery) => (
            <Link key={mastery.id} href={`/leaderboard/goals/${mastery.id}`}>
              <div
                className="p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
                style={{
                  borderColor: `${mastery.color}40`,
                  backgroundColor: `${mastery.color}08`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = mastery.color;
                  e.currentTarget.style.backgroundColor = `${mastery.color}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${mastery.color}40`;
                  e.currentTarget.style.backgroundColor = `${mastery.color}08`;
                }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{mastery.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg dark:text-white">{mastery.name}</h3>
                    <p
                      className="text-sm font-medium mt-0.5"
                      style={{ color: mastery.color }}
                    >
                      {mastery.aspect}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {mastery.playerCount} participants
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <span
                    className="text-sm font-medium"
                    style={{ color: mastery.color }}
                  >
                    View Leaderboard →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Profile Widget (Desktop) */}
      <aside className="w-[450px] p-6 overflow-auto hidden md:block h-screen">
        <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-gray-800">
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

            <div className="bg-gray-100 w-full flex flex-col rounded-md items-center justify-between p-4 dark:bg-dark-3">
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

        {/* Info card */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            How Mastery Works
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Your mastery title reflects your strongest life aspect. Earn XP in different aspects to shape your path:
          </p>
          <div className="space-y-2 text-sm">
            {MASTERY_TYPES.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <span>{m.emoji}</span>
                <span className="font-medium" style={{ color: m.color }}>{m.name}</span>
                <span className="text-gray-500 dark:text-gray-400">– {m.aspect}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
