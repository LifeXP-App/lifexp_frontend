"use client";

import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";
import { FireIcon, InformationCircleIcon } from "@heroicons/react/24/solid";
import { LiveAvatar } from "@/src/components/LiveAvatar";
import { usePopup } from "@/src/context/PopupContext";
import { useQuery } from "@tanstack/react-query";
import { authedFetch } from "@/src/lib/api/authedFetch";
import Image from "next/image";
import Link from "next/link";
import StrengthBars from "@/src/components/habits/StrengthBars";
import type { StrengthTier } from "@/src/components/habits/StrengthInfoPopup";
import { to12Hour } from "@/src/lib/utils/habitTime";
import { hexToRgba } from "@/src/components/UserAccent";
import { toRoman } from "@/src/lib/utils/toRoman";

// Darkens a hex color by a fraction (0-1) toward black — used for the mastery
// progress bar's filled portion so it reads as a deeper shade of the mastery
// color rather than the flat color itself.
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

// Just the habit fields this card reads (the habits API returns more).
type SidebarHabit = {
  id: number;
  activity_uid: string;
  activity_type: ActivityType;
  display_name: string;
  is_frozen: boolean;
  strength_tier: StrengthTier;
  today: boolean;
  today_time: string | null;
  week_progress?: { today: number; progress: boolean[] };
};

const isDoneToday = (h: SidebarHabit) => {
  const { today = -1, progress = [] } = h.week_progress ?? {};
  return today >= 0 && !!progress[today];
};

const formatTime = (time: string | null) => {
  const { hour12, minute, pm } = to12Hour(time ?? "12:00");
  return `${hour12}:${String(minute).padStart(2, "0")} ${pm ? "PM" : "AM"}`;
};

type RightSidebarInfoProps = {
  user: {
    username: string;
    fullname: string;
    profile_picture: string;
    mastery: string;
    masteryLevel?: number;
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
  const { openMasteryPopup } = usePopup();

  // Same query keys as the habits page, so both share one cache. The habits
  // list only holds uncategorized habits; categorized ones come nested.
  const { data: uncategorized = [] } = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const res = await authedFetch("/api/habits", { cache: "no-store" });
      if (!res.ok) return [] as SidebarHabit[];
      const data = await res.json();
      return (Array.isArray(data.results) ? data.results : []) as SidebarHabit[];
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["habits", "categories"],
    queryFn: async () => {
      const res = await authedFetch("/api/habits/categories", { cache: "no-store" });
      if (!res.ok) return [] as { habits: SidebarHabit[] }[];
      const data = await res.json();
      return (Array.isArray(data) ? data : []) as { habits: SidebarHabit[] }[];
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Habits scheduled for today, in time order; finished ones sink to the end.
  const todayHabits = [
    ...uncategorized,
    ...categories
      .flatMap((c) => c.habits)
      .filter((ch) => !uncategorized.some((h) => h.id === ch.id)),
  ]
    .filter((h) => h.today && !h.is_frozen)
    .sort(
      (a, b) =>
        Number(isDoneToday(a)) - Number(isDoneToday(b)) ||
        (a.today_time ?? "12:00").localeCompare(b.today_time ?? "12:00") ||
        a.id - b.id,
    );

  const isMastery = user.mastery !== "Rookie";
  const masteryLevelLabel =
    isMastery && user.masteryLevel && user.masteryLevel > 0
      ? `${user.mastery} ${toRoman(user.masteryLevel)}`
      : user.mastery;

  return (
    <aside className="w-full hidden md:block ">
      {/* PROFILE CARD */}
      <div className="bg-white p-6 mb-4 rounded-xl border border-gray-200 dark:bg-dark-2 dark:border-[var(--border)]">
        <div className="text-center flex flex-col items-center">
          <Link
            href={`/u/${user.username}`}
            className="flex flex-col items-center gap-2"
          >
            <LiveAvatar username={user.username}>
              <Image
                src={user.profile_picture || "/default_pfp.png"}
                width={96}
                height={96}
                className="h-24 w-24 object-cover aspect-square p-[1.5px] rounded-full"
                alt="Profile"
              />
            </LiveAvatar>
            <h3 className="font-semibold">{user.fullname}</h3>
          </Link>

          <span className="flex gap-1 justify-center items-center cursor-pointer">
            <button
              type="button"
              onClick={openMasteryPopup}
              className="mastery-info flex cursor-pointer"
            >
              <InformationCircleIcon
                className={
                  isMastery
                    ? "w-4 h-4"
                    : "w-4 h-4 text-gray-400 dark:text-[var(--muted)] dark:hover:text-[var(--muted)]"
                }
                style={isMastery ? { color: user.masteryColor, opacity: 0.5 } : undefined}
              />
            </button>
            <p
              className="text-sm font-bold"
              style={{
                color: user.mastery == "Rookie" ? "#9aa0ae" : user.masteryColor,
              }}
            >
              {masteryLevelLabel}
            </p>
            <span className="w-4" />
          </span>
        </div>

        {/* STATS */}
        <div className="mt-4 flex justify-between text-sm">
          <Stat label="Level" value={user.lifelevel} />
          <Stat label="Posts" value={user.posts} />
          <Stat label="Followers" value={user.followers} />
          <Stat label="Following" value={user.following} />
        </div>

        {/* XP BAR */}
        <div
          title={`${user.totalXp} / ${user.nextLevelXp} XP`}
          className="w-full relative rounded-full cursor-pointer h-6 my-4 ml-1 overflow-hidden"
          style={{
            backgroundColor: isMastery ? hexToRgba(user.masteryColor, 0.15) : "rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="h-6"
            style={
              isMastery
                ? { width: `${user.progressPercent}%`, backgroundColor: darkenHex(user.masteryColor, 0.35) }
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
                ? "cursor-pointer w-full flex flex-col rounded-md items-center justify-center p-4"
                : "bg-gray-100 dark:bg-dark-3 cursor-pointer w-full flex flex-col rounded-md items-center justify-center p-4 dark:bg-[var(--dark-1)] dark:bg-opacity-50"
            }
            style={isMastery ? { backgroundColor: hexToRgba(user.masteryColor, 0.12) } : undefined}
          >
            <p
              className="text-lg font-bold"
              style={{
                color: user.mastery == "Rookie" ? "#9aa0ae" : user.masteryColor,
              }}
            >
              {user.totalXp} XP
            </p>
          </div>

          <Link href="/streaks" aria-label={`Streak: ${user.streak} days. Open streaks`} className={`bg-gray-100 dark:bg-dark-3 cursor-pointer w-full flex flex-col rounded-md items-center justify-between p-4 transition hover:brightness-110 ${
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
          </Link>
        </div>
      </div>
      {/* TODAY */}
      {todayHabits.length > 0 && (
        <div className="bg-white p-6 mb-4 rounded-xl border border-gray-200 dark:bg-dark-2 dark:border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Today</h3>
            <span className="text-sm font-medium text-gray-400 dark:text-[var(--muted)]">
              {todayHabits.filter((h) => !isDoneToday(h)).length} Left
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {todayHabits.map((habit) => (
              <Link
                key={habit.id}
                href={`/habits/${habit.activity_uid}`}
                className={`flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-3 rounded-md p-3 ${
                  isDoneToday(habit) ? "opacity-50" : ""
                }`}
              >
                <StrengthBars
                  tier={habit.strength_tier}
                  color={ACTIVITY_META[habit.activity_type].cssColorVar}
                />
                <p className="text-sm font-medium truncate flex-1">{habit.display_name}</p>
                <span className="shrink-0 text-sm font-semibold text-gray-500 dark:text-[var(--muted)]">
                  {formatTime(habit.today_time)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* <div
        id="next-level-tab"
        className="bg-white p-6 mb-4 rounded-xl border border-gray-200 dark:bg-dark-2 dark:border-[var(--border)]"
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
      </div> */}

      
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
