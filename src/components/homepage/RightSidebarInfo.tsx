"use client";

import { FireIcon, InformationCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
type RightSidebarInfoProps = {
  user: {
    username: string;
    fullname: string;
    profile_picture: string;
    mastery: string;
    masteryColor: string;
    lifelevel: number;
    posts: number;
    followers: number;
    following: number;
    totalXp: number;
    nextLevelXp: number;
    xpToNextLifeLevel: number;
    xpToNextMasteryLevel: number;
    progressPercent: number;
    rank: number;
    streak: number;
    streak_active?: boolean; // optional
  };
};

export function RightSidebarInfo({ user }: RightSidebarInfoProps) {
  return (
    <aside className="w-full hidden md:block ">
      {/* PROFILE CARD */}
      <div className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900">
        <div className="text-center flex flex-col items-center">
          <Link
            href={`/u/${user.username}`}
            className="flex flex-col items-center gap-2"
          >
            <img
              src={user.profile_picture}
              className="h-24 w-24 object-cover aspect-square p-[1.5px] rounded-full"
              loading="lazy"
              alt="Profile"
            />
            <h3 className="font-semibold">{user.fullname}</h3>
          </Link>

          <span className="flex gap-1 justify-center items-center cursor-pointer">
            <button type="button" className="mastery-info flex cursor-pointer">
              <InformationCircleIcon className="w-4 h-4 text-gray-400 dark:text-gray-600 dark:hover:text-gray-400" />
            </button>
            <p
              className="text-sm font-bold"
              style={{
                color: user.mastery == "Rookie" ? "#9aa0ae" : user.masteryColor,
              }}
            >
              {user.mastery}
            </p>
            <span className="w-4" />
          </span>
        </div>

        {/* STATS */}
        <div className="mt-4 flex justify-between text-sm">
          <Stat label="Life Level" value={user.lifelevel} />
          <Stat label="Posts" value={user.posts} />
          <Stat label="Followers" value={user.followers} />
          <Stat label="Following" value={user.following} />
        </div>

        {/* XP BAR */}
        <div
          className="w-full relative rounded-full h-4 my-4 ml-1 overflow-hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="h-6"
            style={{
              width: `${user.progressPercent}%`,
              background: `linear-gradient(to right, ${user.masteryColor}60 0%, ${user.masteryColor} 100%)`,
            }}
          />
          <p className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
            {user.totalXp} / {user.nextLevelXp}
          </p>
        </div>

        {/* XP + STREAK */}
        <div className="mt-4 flex justify-between text-sm gap-4">
          <div className="bg-gray-100 w-full flex flex-col rounded-md items-center justify-between p-4 dark:bg-gray-900 dark:bg-opacity-50">
            <p
              className="text-lg font-bold"
              style={{
                color: user.mastery == "Rookie" ? "#9aa0ae" : user.masteryColor,
              }}
            >
              {user.totalXp} XP
            </p>
            <Link href={`/leaderboard/${user.mastery.toLowerCase()}`}>
              <p className="text-xs text-gray-500">
                Overall ranked <b>#{user.rank}</b>
              </p>
            </Link>
          </div>

          <div className="bg-gray-100 w-full hidden md:flex flex-col rounded-md items-center justify-between p-4 dark:bg-gray-900 dark:bg-opacity-50">
            <p className="text-sm">Streak Count</p>
            <p className="text-lg font-extrabold text-gray-400 dark:text-gray-600 flex gap-1 items-center">
              {user.streak_active ? (
                <FireIcon className="w-6 h-6 inline-block ml-1 text-yellow-500 animate-pulse" />
              ) : (
                <FireIcon className="w-6 h-6 inline-block ml-1 text-gray-400 dark:text-gray-600" />
              )}
              {user.streak}
            </p>
          </div>
        </div>
      </div>
      <div
        id="next-level-tab"
        className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-900"
      >
        {user.mastery != "Rookie" ? (
          <>
            <div className="flex justify-between mb-6">
              <span className="text-base font-semibold">
                Mastery at Life Level 10
              </span>

              <span className="text-sm font-medium opacity-50 flex gap-1 items-center">
                10,000 XP
              </span>
            </div>
            <div className="w-full flex gap-1 items-center">
              <div
                className="w-full rounded-full h-2.5 ml-1"
                style={{ backgroundColor: "#4168e210" }}
              >
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    backgroundColor: "#4168e2",
                    width: `${user.totalXp / 100}%`,
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between mb-6">
              <span className="text-base font-semibold">{user.mastery}</span>

              <span className="text-sm font-medium opacity-50 flex gap-1 items-center">
                {user.xpToNextMasteryLevel} XP
              </span>
            </div>
            <div className="w-full flex gap-1 items-center">
              <div
                className="w-full rounded-full h-2.5 ml-1"
                style={{ backgroundColor: "#4168e210" }}
              >
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    backgroundColor: "#4168e2",
                    width: `${(user.totalXp / user.xpToNextMasteryLevel) * 100}%`,
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

/* ---------------- SMALL HELPER ---------------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-semibold">{value}</p>
      <p className="text-gray-500">{label}</p>
    </div>
  );
}
