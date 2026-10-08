"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import FireIcon from "@heroicons/react/24/solid/FireIcon";
import { LiveAvatar } from "@/src/components/LiveAvatar";
import { NudgesLikesSection } from "@/src/components/goals/NudgesLikesSection";
import { usePopup } from "@/src/context/PopupContext";
import { useAuth } from "@/src/context/AuthContext";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { hexToRgba } from "@/src/components/UserAccent";
import { toRoman } from "@/src/lib/utils/toRoman";

// Shared by /goals and /habits (and any future tab in this nav group) so the
// profile/XP/streak card and Today list stay identical across them instead
// of each page carrying its own copy — was previously inlined in
// app/(main)/goals/page.tsx only.

type UserGoalsInfo = {
  username: string;
  fullname: string;
  profile_picture: string;
  mastery: string;
  masteryLevel?: number;
  masteryColor: string;
  masteryTextColor: string;
  lifelevel: number;
  ongoing: number;
  planned: number;
  completed: number;
  followers: number;
  following: number;
  totalXp: number;
  nextLevelXp: number;
  progressPercent: number;
  rank: number;
  streak: number;
  streak_active: boolean;
};

// Darkens a hex color by a fraction (0-1) toward black — used for the
// mastery progress bar's filled portion so it reads as a deeper shade of
// the mastery color rather than the flat color itself.
function darkenHex(hex: string, amount: number) {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const intVal = parseInt(full, 16);
  const r = Math.round(((intVal >> 16) & 255) * (1 - amount));
  const g = Math.round(((intVal >> 8) & 255) * (1 - amount));
  const b = Math.round((intVal & 255) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-semibold dark:text-[var(--foreground)]">{value}</p>
      <p className="text-gray-500 dark:text-[var(--muted)]">{label}</p>
    </div>
  );
}

function RightSidebarInfoSkeleton() {
  return (
    <aside className="w-[400px] hidden md:block">
      {/* PROFILE CARD */}
      <div className="bg-white p-6 mb-4 rounded-xl border border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] animate-pulse">
        <div className="text-center flex flex-col items-center">
          {/* avatar */}
          <div className="h-24 w-24 aspect-square p-[1.5px] rounded-full bg-gray-200 dark:bg-dark-3 mb-3" />

          {/* fullname */}
          <div className="h-4 w-40 rounded bg-gray-200 dark:bg-dark-3 mb-3" />

          {/* mastery row */}
          <span className="flex gap-2 justify-center items-center">
            <div className="h-4 w-4 rounded bg-gray-200 dark:bg-dark-3" />
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-dark-3" />
            <span className="w-4" />
          </span>
        </div>

        {/* STATS */}
        <div className="mt-4 flex justify-between text-sm">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-4 w-6 mx-auto rounded bg-gray-200 dark:bg-dark-3 mb-2" />
              <div className="h-3 w-14 mx-auto rounded bg-gray-200 dark:bg-dark-3" />
            </div>
          ))}
        </div>

        {/* XP BAR */}
        <div className="w-full relative rounded-full h-4 my-4 ml-1 overflow-hidden bg-gray-200 dark:bg-dark-3">
          <div className="h-6 w-[55%] bg-gray-300 dark:bg-dark-3" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-20 rounded bg-gray-300/80 dark:bg-dark-3/70" />
          </div>
        </div>

        {/* XP + STREAK */}
        <div className="mt-4 flex justify-between text-sm gap-4">
          <div className="bg-gray-100 w-full flex flex-col rounded-md items-center justify-between p-4 dark:bg-dark-3 dark:bg-opacity-50">
            <div className="h-5 w-24 rounded bg-gray-200 dark:bg-dark-3 mb-2" />
            <div className="h-3 w-28 rounded bg-gray-200 dark:bg-dark-3" />
          </div>

          <div className="bg-gray-100 w-full hidden md:flex flex-col rounded-md items-center justify-between p-4 dark:bg-dark-3 dark:bg-opacity-50">
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-dark-3 mb-2" />
            <div className="flex gap-2 items-center">
              <div className="h-4 w-4 rounded bg-gray-200 dark:bg-dark-3" />
              <div className="h-5 w-8 rounded bg-gray-200 dark:bg-dark-3" />
            </div>
          </div>
        </div>
      </div>

      {/* NEXT LEVEL TAB CARD */}
      <div
        id="next-level-tab"
        className="bg-white p-6 mb-4 rounded-xl border border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] animate-pulse"
      >
        <div className="flex justify-between mb-6">
          <div className="h-4 w-44 rounded bg-gray-200 dark:bg-dark-3" />
          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-dark-3" />
        </div>

        <div className="w-full flex gap-1 items-center">
          <div className="w-full rounded-full h-2.5 ml-1 bg-gray-200 dark:bg-dark-3 overflow-hidden">
            <div className="h-2.5 w-[12%] rounded-full bg-gray-300 dark:bg-dark-3" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function RightSidebarInfo({ user }: { user: UserGoalsInfo }) {
  const { openMasteryPopup } = usePopup();
  const isMastery = user.mastery !== "Rookie";
  const masteryLevelLabel =
    isMastery && user.masteryLevel && user.masteryLevel > 0
      ? `${user.mastery} ${toRoman(user.masteryLevel)}`
      : user.mastery;
  return (
    <aside className="w-[400px] hidden md:block">
      {/* PROFILE CARD */}
      <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border border-gray-200 dark:border-[var(--border)]">
        <div className="text-center flex flex-col items-center">
          <div className="flex flex-col items-center">
            <LiveAvatar username={user.username}>
              <Image
                src={user.profile_picture || "/default_pfp.png"}
                width={96}
                height={96}
                className="h-24 w-24 object-cover aspect-square p-[1.5px] rounded-full"
                alt="Profile"
              />
            </LiveAvatar>
            <h3 className="font-semibold mt-2 dark:text-[var(--foreground)]">
              {user.fullname}
            </h3>
          </div>

          <span className="flex gap-1 justify-center items-center cursor-pointer mt-1">
            <button type="button" className="flex cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                onClick={openMasteryPopup}
                className={
                  isMastery ? "w-4 h-4" : "w-4 h-4 text-gray-400 dark:text-[var(--muted)]"
                }
                style={isMastery ? { color: user.masteryColor, opacity: 0.5 } : undefined}
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-5.25a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 1.5 0V7.5a.75.75 0 0 0-.75-.75Zm0 4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0V12a.75.75 0 0 0-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <button
              className="text-sm font-bold"
              onClick={openMasteryPopup}
              style={{ color: user.masteryColor }}
            >
              {masteryLevelLabel}
            </button>
            <span className="w-4" />
          </span>
        </div>

        {/* STATS */}
        <div className="mt-4 flex justify-between text-sm">
          <Stat label="Life Level" value={user.lifelevel} />
          <Stat label="Ongoing" value={user.ongoing} />
          <Stat label="Planned" value={user.planned} />
          <Stat label="Completed" value={user.completed} />
        </div>

        {/* XP BAR */}
        <div
          title={`${user.totalXp} / ${user.nextLevelXp} XP`}
          className="w-full relative rounded-full cursor-pointer h-6 my-4 ml-1 overflow-hidden"
          style={{
            backgroundColor: isMastery
              ? hexToRgba(user.masteryColor, 0.15)
              : "rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="h-6"
            style={
              isMastery
                ? {
                    width: `${user.progressPercent}%`,
                    backgroundColor: darkenHex(user.masteryColor, 0.35),
                  }
                : {
                    width: `${user.progressPercent}%`,
                    background: `linear-gradient(to right, ${user.masteryColor}60 0%, ${user.masteryColor} 100%)`,
                  }
            }
          />
          <p className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
            Level {user.lifelevel} ({user.totalXp} XP)
          </p>
        </div>

        {/* XP + STREAK */}
        <div className="mt-4 flex justify-between text-sm gap-4">
          <div
            className={
              isMastery
                ? "w-full flex flex-col rounded-md items-center justify-between p-4"
                : "bg-gray-100 dark:bg-dark-3 w-full flex flex-col rounded-md items-center justify-between p-4"
            }
            style={isMastery ? { backgroundColor: hexToRgba(user.masteryColor, 0.12) } : undefined}
          >
            <p
              className="text-lg font-bold"
              style={{ color: user.masteryColor }}
            >
              {user.totalXp} XP
            </p>
            <p
              className={isMastery ? "text-xs" : "text-xs text-gray-500 dark:text-[var(--muted)]"}
              style={isMastery ? { color: user.masteryColor, opacity: 0.5 } : undefined}
            >
              Overall ranked <b>#{user.rank}</b>
            </p>
          </div>

          <div className={`bg-gray-100 dark:bg-dark-3 w-full flex flex-col rounded-md items-center justify-between p-4 ${
                  user.streak_active
                    ? "bg-orange-500/10 text-orange-500 "
                    : ""
                }`}>
            <p className="text-sm dark:text-[var(--muted)]">Streak Count</p>

            <p className={`text-lg font-extrabold text-gray-400 dark:text-[var(--muted)] flex gap-1 items-center ${
                  user.streak_active
                    ? "text-orange-500 "
                    : "text-gray-400 dark:text-[var(--muted)]"
                }`}>
              <FireIcon
                className={`w-6 h-6 inline-block ml-1 ${
                  user.streak_active
                    ? "text-orange-500"
                    : "text-gray-400 dark:text-[var(--muted)] "
                }`}
              />
              {user.streak}
            </p>
          </div>
        </div>
      </div>
      <NudgesLikesSection />
    </aside>
  );
}

// The actual export — handles its own data fetching (sidebarInfo query) so
// callers just drop <GoalsRightSidebar /> in without wiring anything up.
export function GoalsRightSidebar() {
  const { me } = useAuth();
  const username = me?.username;

  const { data: sidebarInfo = null, isLoading: sidebarLoading } = useQuery({
    queryKey: ["goals", "sidebar", username],
    queryFn: async () => {
      // Proxied through /api/goals/info/[username] (httpOnly-cookie auth,
      // same reasoning as the goals list query) instead of calling Django
      // directly with the browser SDK's session token.
      const res = await authedFetch(`/api/goals/info/${username}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch sidebar info");

      return (await res.json()) as UserGoalsInfo;
    },
    enabled: !!username,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const showSkeleton = sidebarLoading && !sidebarInfo;

  if (showSkeleton || !sidebarInfo) {
    return <RightSidebarInfoSkeleton />;
  }

  return <RightSidebarInfo user={sidebarInfo} />;
}
