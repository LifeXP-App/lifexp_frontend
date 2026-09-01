"use client";

import { FireIcon, InformationCircleIcon } from "@heroicons/react/24/solid";
import { LiveAvatar } from "@/src/components/LiveAvatar";
import { usePopup } from "@/src/context/PopupContext";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ClockType } from "@/src/components/goals/PickTimerModePopup";

const NewActivityModal = dynamic(
  () => import("@/src/components/goals/NewActivityModel"),
);
const PickTimerModePopup = dynamic(
  () => import("@/src/components/goals/PickTimerModePopup"),
);

// Mirrors NewActivityModal's own Activity shape — kept local since this file
// only needs it to build the session-start URL, not the modal's full picker state.
type PickedActivity = {
  id: string;
  uid?: string;
  xp_distribution?: Record<string, number>;
};

type TodayGoal = {
  uid: string;
  emoji: string | null;
  title: string | null;
  completed: boolean;
};

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
  const { openMasteryPopup } = usePopup();
  const router = useRouter();

  const { data: todayGoals = [] } = useQuery({
    queryKey: ["today-goals", user.username],
    queryFn: async () => {
      const res = await fetch("/api/goals/today", { cache: "no-store" });
      if (!res.ok) return [] as TodayGoal[];
      return (await res.json()) as TodayGoal[];
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityPickerGoalUid, setActivityPickerGoalUid] = useState<string | null>(null);
  const [pendingActivity, setPendingActivity] = useState<PickedActivity | null>(null);

  const handleOpenActivityPicker = (goalUid: string) => {
    setActivityPickerGoalUid(goalUid);
    setIsActivityModalOpen(true);
  };

  const handleSelectActivity = (activity: PickedActivity) => {
    // Hand off to the timer-mode popup before actually starting anything —
    // the activity modal stays hidden (not closed) so "Back" can reopen it.
    setIsActivityModalOpen(false);
    if (!activityPickerGoalUid) return;
    setPendingActivity(activity);
  };

  const handleBackToActivityPicker = () => {
    setPendingActivity(null);
    setIsActivityModalOpen(true);
  };

  const handleStartWithMode = (clockType: ClockType, durationSeconds: number) => {
    const activity = pendingActivity;
    if (!activity || !activityPickerGoalUid) return;
    setPendingActivity(null);

    // Django's session register resolves activities by uid, so never send
    // the integer pk — a pk-only reference 400s the register.
    const activityRef = activity.uid ?? activity.id;

    const dist = activity.xp_distribution ?? {};
    const SECONDS_PER_HOUR = 3600;
    const aspects = ["physique", "energy", "logic", "creativity", "social"] as const;
    const totalXp = aspects.reduce((s, k) => s + (dist[k] ?? 0), 0);
    const rates =
      totalXp > 0
        ? aspects.reduce((acc, k) => {
            acc[k] = Math.round(((dist[k] ?? 0) / SECONDS_PER_HOUR) * 10000) / 10000;
            return acc;
          }, {} as Record<string, number>)
        : {};
    const ratesParam =
      Object.keys(rates).length > 0
        ? `&rates=${encodeURIComponent(JSON.stringify(rates))}`
        : "";
    const modeParam = `&clockType=${clockType}${clockType === "timer" ? `&duration=${durationSeconds}` : ""}`;

    router.push(`/goals/${activityPickerGoalUid}/session/new?activity=${activityRef}${ratesParam}${modeParam}`);
  };

  const handleGenerateNewActivity = (query: string) => {
    setIsActivityModalOpen(false);
    if (activityPickerGoalUid) {
      router.push(`/goals/${activityPickerGoalUid}?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <aside className="w-full hidden md:block ">
      {/* PROFILE CARD */}
      <div className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-[var(--border)]">
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
              <InformationCircleIcon className="w-4 h-4 text-gray-400 dark:text-[var(--muted)] dark:hover:text-[var(--muted)]" />
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
          <Stat label="Level" value={user.lifelevel} />
          <Stat label="Posts" value={user.posts} />
          <Stat label="Followers" value={user.followers} />
          <Stat label="Following" value={user.following} />
        </div>

        {/* XP BAR */}
        <div
          title={`${user.totalXp} / ${user.nextLevelXp} XP`}
          className="w-full relative rounded-full cursor-pointer h-6 my-4 ml-1 overflow-hidden"
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
            Level {user.lifelevel} ({user.totalXp} XP)
          </p>
        </div>

        {/* XP + STREAK */}
        <div className="mt-4 flex justify-between text-sm gap-4">
          <div className="bg-gray-100 dark:bg-dark-3 cursor-pointer w-full flex flex-col rounded-md items-center justify-center p-4 dark:bg-[var(--dark-1)] dark:bg-opacity-50">
            <p
              className="text-lg font-bold"
              style={{
                color: user.mastery == "Rookie" ? "#9aa0ae" : user.masteryColor,
              }}
            >
              {user.totalXp} XP
            </p>
            
          </div>

          <div className={`bg-gray-100 dark:bg-dark-3 cursor-pointer w-full flex flex-col rounded-md items-center justify-between p-4 ${
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
      {/* TODAY */}
      {todayGoals.length > 0 && (
        <div className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Today</h3>
            <span className="text-sm font-medium text-gray-400 dark:text-[var(--muted)]">
              {todayGoals.filter((g) => !g.completed).length} Left
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {todayGoals.map((goal) =>
              goal.completed ? (
                <Link
                  key={goal.uid}
                  href={`/goals/${goal.uid}`}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:bg-dark-3 dark:bg-opacity-50 rounded-md p-3 opacity-50"
                >
                  <span className="text-2xl shrink-0">{goal.emoji || "🎯"}</span>
                  <p className="text-sm font-medium truncate flex-1">
                    {goal.title || "Untitled goal"}
                  </p>
                  <span
                    className="h-5 w-5 shrink-0 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--rookie-primary)" }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                </Link>
              ) : (
                <button
                  key={goal.uid}
                  type="button"
                  onClick={() => handleOpenActivityPicker(goal.uid)}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:bg-dark-3 dark:bg-opacity-50 rounded-md p-3 text-left w-full"
                >
                  <span className="text-2xl shrink-0">{goal.emoji || "🎯"}</span>
                  <p className="text-sm font-medium truncate flex-1">
                    {goal.title || "Untitled goal"}
                  </p>
                  <span className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-300 dark:border-[var(--border)]" />
                </button>
              ),
            )}
          </div>
        </div>
      )}

      <NewActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSelectActivity={handleSelectActivity}
        onGenerateNew={handleGenerateNewActivity}
        goalUid={activityPickerGoalUid}
      />

      {pendingActivity && (
        <PickTimerModePopup
          isOpen
          activityUid={pendingActivity.uid ?? pendingActivity.id}
          onBack={handleBackToActivityPicker}
          onClose={() => setPendingActivity(null)}
          onStart={handleStartWithMode}
        />
      )}

      {/* <div
        id="next-level-tab"
        className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-[var(--border)]"
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
