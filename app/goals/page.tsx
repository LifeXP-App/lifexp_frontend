"use client";

import React from "react";
import FireIcon from "@heroicons/react/24/solid/FireIcon";
type AspectKey = "physique" | "energy" | "social" | "creativity" | "logic";

type GoalStatus = "ongoing" | "planned" | "completed";

type Goal = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  status: GoalStatus;

  // top-right label (ongoing shows "time spent", planned shows "Planned", completed shows XP pill)
  metaRight?: string;

  // completed extra info
  timeSummary?: string;
  xpReward?: number;

  aspectXP?: Record<AspectKey, number>;
};

const mockGoals: Goal[] = [
  {
    id: "g1",
    emoji: "🎨",
    title: "Drawing Mandalorian",
    description:
      "Wanted to get back to drawing and make some really good art of one of my favorite characters, so here it...",
    status: "ongoing",
    metaRight: "5h 20m spent",
  },
  {
    id: "g2",
    emoji: "💪",
    title: "Gain 3lbs in 2 weeks through stre..",
    description:
      "Haven’t been working out for sometime so I wanted to focus for the next 2 weeks, and try to gain atleast...",
    status: "planned",
    metaRight: "Planned",
  },
  {
    id: "g3",
    emoji: "🎶",
    title: "Practice for sem end music fest",
    description:
      "Wanted to get back to drawing and make some really good art of one of my favorite characters, so here it...",
    status: "completed",
    xpReward: 120,
    timeSummary: "12h 30m over 3 months",
    aspectXP: {
      physique: 24,
      energy: 24,
      social: 24,
      creativity: 24,
      logic: 24,
    },
  },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-black mb-3">{children}</h2>;
}

function GoalCard({
  goal,
  primaryCta,
  secondaryCta,
  showAchievementCta,
}: {
  goal: Goal;
  primaryCta?: { label: string; onClick: () => void };
  secondaryCta?: { label: string; onClick: () => void };
  showAchievementCta?: { label: string; onClick: () => void };
}) {
  const isCompleted = goal.status === "completed";

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="text-xl leading-none mt-1">{goal.emoji}</div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-lg text-black truncate">
                {goal.title}
              </p>

              {isCompleted && typeof goal.xpReward === "number" && (
                <span className="ml-2 shrink-0 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  {goal.xpReward}XP
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-3 line-clamp-2">
              {goal.description}
            </p>
          </div>
        </div>

        {/* Right meta */}
        {!isCompleted && goal.metaRight && (
          <p className="text-xs text-gray-400 italic whitespace-nowrap mt-1">
            {goal.metaRight}
          </p>
        )}
      </div>

      {/* Completed extra row */}
      {isCompleted && goal.timeSummary && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-flex items-center justify-center">
            {/* clock icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.75 5.25a.75.75 0 0 0-1.5 0v4.25c0 .2.08.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28V7.5Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <span>{goal.timeSummary}</span>
        </div>
      )}

      {/* Aspect chips */}
      {isCompleted && goal.aspectXP && (
        <div className="mt-4 grid grid-cols-5 gap-2">
          <AspectChip label="💪" value={goal.aspectXP.physique} tint="red" />
          <AspectChip label="⚡" value={goal.aspectXP.energy} tint="yellow" />
          <AspectChip label="👥" value={goal.aspectXP.social} tint="green" />
          <AspectChip label="🧠" value={goal.aspectXP.creativity} tint="blue" />
          <AspectChip label="🧩" value={goal.aspectXP.logic} tint="purple" />
        </div>
      )}

      {/* Buttons */}
      <div className="mt-6  flex gap-3">
        {primaryCta && (
          <button
            onClick={primaryCta.onClick}
            className="flex-1 rounded-xl cursor-pointer bg-blue-600 text-white font-semibold py-3 hover:bg-blue-700 transition"
          >
            {primaryCta.label}
          </button>
        )}

        {secondaryCta && (
          <button
            onClick={secondaryCta.onClick}
            className="flex-1 rounded-xl cursor-pointer bg-gray-700 text-white font-semibold py-3 hover:bg-gray-800 transition"
          >
            {secondaryCta.label}
          </button>
        )}

        {showAchievementCta && (
          <button
            onClick={showAchievementCta.onClick}
            className="w-full rounded-xl bg-gray-700 text-white font-semibold py-3 hover:bg-gray-800 transition"
          >
            {showAchievementCta.label}
          </button>
        )}
      </div>
    </div>
  );
}

function AspectChip({
  label,
  value,
  tint,
}: {
  label: string;
  value: number;
  tint: "red" | "yellow" | "green" | "blue" | "purple";
}) {
  const tintMap: Record<typeof tint, string> = {
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <div
      className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold ${tintMap[tint]}`}
    >
      <span className="opacity-80">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function GoalsPage() {
  const ongoing = mockGoals.filter((g) => g.status === "ongoing");
  const planned = mockGoals.filter((g) => g.status === "planned");
  const completed = mockGoals.filter((g) => g.status === "completed");

  return (
    <main className="h-screen w-full bg-gray-100 overflow-hidden">
      <div className="mx-auto w-full  px-4 py-6">
        <div className="flex w-full gap-6">
          {/* LEFT MAIN CONTENT */}
          <div className="w-full h-screen overflow-scroll noscrollbar py-4 px-6 md:px-12">
            {/* Title */}
            <h1 className="text-xl font-bold text-black mb-4">Goals</h1>

            {/* Create new goal */}
            <button
              onClick={() => alert("Create New Goal")}
              className="w-full rounded-2xl cursor-pointer bg-gray-200 text-black font-semibold py-4 flex items-center justify-start gap-3 px-5 hover:bg-gray-300 transition"
            >
              <span className="text-lg cursor-pointer leading-none">＋</span>
              <span>Create New Goal</span>
            </button>

            {/* Ongoing */}
            <div className="mt-6">
              <SectionTitle>Ongoing</SectionTitle>

              <div className="space-y-4">
                {ongoing.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    primaryCta={{
                      label: "New Session",
                      onClick: () => alert(`New Session: ${goal.title}`),
                    }}
                    secondaryCta={{
                      label: "View Goal",
                      onClick: () => alert(`View Goal: ${goal.title}`),
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Planned */}
            <div className="mt-6">
              <SectionTitle>Planned</SectionTitle>

              <div className="space-y-4">
                {planned.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    primaryCta={{
                      label: "Start Goal",
                      onClick: () => alert(`Start Goal: ${goal.title}`),
                    }}
                    secondaryCta={{
                      label: "View Goal",
                      onClick: () => alert(`View Goal: ${goal.title}`),
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Completed */}
            <div className="mt-6">
              <SectionTitle>Completed</SectionTitle>

              <div className="space-y-4">
                {completed.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    showAchievementCta={{
                      label: "View Achievement",
                      onClick: () => alert(`View Achievement: ${goal.title}`),
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="h-8" />
          </div>

          {/* RIGHT SIDEBAR (DESKTOP ONLY) */}
          <RightSidebar />
        </div>
      </div>
    </main>
  );
}

/* ===========================
   RIGHT SIDEBAR (APPENDED)
   =========================== */

function RightSidebar() {
  const user = {
    username: "pat",
    fullname: "Patty",
    profile_picture:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_80,h_80,c_thumb/v1752327292/lfco9m4hqq9yin7adl6e.jpg",

    mastery: "Rookie",
    masteryColor: "#4168e2",
    masteryTextColor:"#9aa0a2",
    lifelevel: 4,
    posts: 9,
    followers: 11,
    following: 45,

    totalXp: 972,
    nextLevelXp: 1000,
    progressPercent: 97.2,

    rank: 4,
    streak: 0,
    streak_active: false,
  };

  return (
    <aside className="w-2xl hidden md:block">
      {/* PROFILE CARD */}
      <div className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200">
        <div className="text-center flex flex-col items-center">
          <div className="flex flex-col items-center">
            <img
              src={user.profile_picture}
              className="h-24 w-24 object-cover aspect-square p-[1.5px] rounded-full"
              loading="lazy"
              alt="Profile"
            />
            <h3 className="font-semibold mt-2">{user.fullname}</h3>
          </div>

          <span className="flex gap-1 justify-center items-center cursor-pointer mt-1">
            <button type="button" className="flex cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-5.25a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 1.5 0V7.5a.75.75 0 0 0-.75-.75Zm0 4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0V12a.75.75 0 0 0-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <p className="text-sm font-bold" style={{ color: user.masteryTextColor }}>
              {user.mastery}
            </p>
            <span className="w-4" />
          </span>
        </div>

        {/* STATS */}
        <div className="mt-4 flex justify-between text-sm">
          <Stat label="Life Level" value={user.lifelevel} />
          <Stat label="Ongoing" value={user.posts} />
          <Stat label="Planned" value={user.followers} />
          <Stat label="Completed" value={user.following} />
        </div>

        

        {/* XP + STREAK */}
        <div className="mt-4 flex justify-between text-sm gap-4">
          <div className="bg-gray-100 w-full flex flex-col rounded-md items-center justify-between p-4">
            <p className="text-lg font-bold" style={{ color: user.masteryTextColor }}>
              {user.totalXp} XP
            </p>
            <p className="text-xs text-gray-500">
              Overall ranked <b>#{user.rank}</b>
            </p>
          </div>

          <div className="bg-gray-100 w-full flex flex-col rounded-md items-center justify-between p-4">
            <p className="text-sm">Streak Count</p>

            <p className="text-lg font-extrabold text-gray-400 flex gap-1 items-center">
              <FireIcon
                className={`w-6 h-6 inline-block ml-1 ${
                  user.streak_active ? "text-yellow-500 animate-pulse" : "text-gray-400"
                }`}
              />
              {user.streak}
            </p>
          </div>
        </div>
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
