"use client";

import NewSessionPopup from "@/src/components/goals/NewSessionPopup";
import { ActivityType } from "@/src/lib/types/activityMeta";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { BoltIcon, UsersIcon } from "@heroicons/react/24/solid";
import FireIcon from "@heroicons/react/24/solid/FireIcon";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { FaBrain, FaHammer } from "react-icons/fa";

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
      "Haven't been working out for sometime so I wanted to focus for the next 2 weeks, and try to gain atleast...",
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

import { NudgesLikesSection } from "@/src/components/goals/NudgesLikesSection";


type InteractionType = "nudge" | "like";
type Interactions = {
  id: string;
  image: string;
  username: string;

  type: InteractionType; // ✅ moved here

  goalTitle?: string;
  activityName?: string;

  date: string;
  href: string;
  rounded?: boolean;
};

const interactions: Interactions[] = [
  {
    id: "1",
    image: "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1755709015/ysyanmka88fuxudiuqhg.jpg",
    username: "alex",
    type: "nudge",
    activityName: "drawing session",
    date: "2m ago",
    href: "/goal/1",
    rounded: true,
  },
  {
    id: "2",
    image: "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1755709015/ysyanmka88fuxudiuqhg.jpg",
    username: "maria",
    type: "like",
    goalTitle: "Drawing Mandalorian...",
    date: "10m ago",
    href: "/goal/1",
    rounded: true,
  },
];




function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-black dark:text-white mb-3">
      {children}
    </h2>
  );
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
    <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-2 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className=" w-full flex items-start gap-3">
          <div className="text-xl leading-none mt-1">{goal.emoji}</div>

          <div className="w-full">
            <div className="flex w-full items-center justify-between ">
              <p className="font-semibold text-lg text-black dark:text-white truncate">
                {goal.title}
              </p>

              {isCompleted && typeof goal.xpReward === "number" && (
                <span
                  style={{
                    backgroundColor: "var(--rookie-primary)",
                  }}
                  className="ml-2 shrink-0 rounded-full  px-3 py-1 text-xs font-semibold text-white"
                >
                  {goal.xpReward}XP
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right meta */}
        {!isCompleted && goal.metaRight && (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic whitespace-nowrap mt-1">
            {goal.metaRight}
          </p>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 line-clamp-2">
        {goal.description}
      </p>
      {/* Completed extra row */}
      {isCompleted && goal.timeSummary && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center justify-center">
            {/* clock icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4 text-gray-400 dark:text-gray-500"
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
          <AspectChip
            icon={<FireIcon className="w-4 h-4" />}
            value={goal.aspectXP.physique}
            tint="physique"
          />
          <AspectChip
            icon={<BoltIcon className="w-4 h-4" />}
            value={goal.aspectXP.energy}
            tint="energy"
          />
          <AspectChip
            icon={<UsersIcon className="w-4 h-4" />}
            value={goal.aspectXP.social}
            tint="social"
          />
          <AspectChip
            icon={<FaBrain className="w-4 h-4" />}
            value={goal.aspectXP.creativity}
            tint="creativity"
          />
          <AspectChip
            icon={<FaHammer className="w-4 h-4" />}
            value={goal.aspectXP.logic}
            tint="logic"
          />
        </div>
      )}

      {/* Buttons */}
      <div className="mt-6  flex gap-3">
        {primaryCta && (
          <button
            onClick={primaryCta.onClick}
            style={{
              backgroundColor: "var(--rookie-primary)",
            }}
            className="flex-1 rounded-xl cursor-pointer text-white font-semibold py-3 hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            {primaryCta.label}
          </button>
        )}

        {secondaryCta && (
          <button
            onClick={secondaryCta.onClick}
            className="flex-1 rounded-xl cursor-pointer bg-gray-700 dark:bg-gray-600 text-white font-semibold py-3 hover:bg-gray-800 dark:hover:bg-gray-700 transition"
          >
            {secondaryCta.label}
          </button>
        )}

        {showAchievementCta && (
          <button
            onClick={showAchievementCta.onClick}
            className="w-full rounded-xl bg-gray-700 dark:bg-gray-600 text-white font-semibold py-3 hover:bg-gray-800 dark:hover:bg-gray-700 transition"
          >
            {showAchievementCta.label}
          </button>
        )}
      </div>
    </div>
  );
}

function AspectChip({
  icon,
  value,
  tint,
}: {
  icon: React.ReactNode;
  value: number;
  tint: "physique" | "energy" | "social" | "creativity" | "logic";
}) {
  const tintMap: Record<typeof tint, string> = {
    physique: "bg-[#8d2e2e]/30 text-[#8d2e2e]",
    energy: "bg-[#c49352]/30 text-[#c49352]",
    social: "bg-[#31784e]/30 text-[#31784e]",
    creativity: "bg-[#4187a2]/30 text-[#4187a2]",
    logic: "bg-[#713599]/30 text-[#713599]",
  };

  return (
    <div
      className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold ${tintMap[tint]}`}
    >
      <span>{icon}</span>
      <span>{value}</span>
    </div>
  );
}

/* ===========================
   NEW GOAL MODAL
   =========================== */

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: {
    title: string;
    description: string;
    finishBy: string;
  }) => void;
}

function NewGoalModal({ isOpen, onClose, onSubmit }: NewGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "1w" | "2w" | "1m" | "6m" | "custom" | null
  >(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [customDate, setCustomDate] = useState("");

  if (!isOpen) return null;

  const handlePeriodSelect = (period: "1w" | "2w" | "1m" | "6m" | "custom") => {
    setSelectedPeriod(period);
    if (period === "custom") {
      setShowCalendar(true);
    } else {
      setShowCalendar(false);
      setCustomDate("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finishByDate = "";
    if (selectedPeriod === "custom") {
      finishByDate = customDate;
    } else if (selectedPeriod) {
      finishByDate = selectedPeriod;
    }

    onSubmit({
      title,
      description,
      finishBy: finishByDate,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setSelectedPeriod(null);
    setShowCalendar(false);
    setCustomDate("");
  };

  const isFormValid =
    title.trim() !== "" &&
    selectedPeriod !== null &&
    (selectedPeriod !== "custom" || customDate !== "");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30  bg-opacity-50 z-40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-gray-100 dark:bg-dark-2 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden dark:border dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h2 className="text-xl  font-bold text-black dark:text-white">
              Create New Goal
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors cursor-pointer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} >
            {/* Title Input */}
            <div  className="px-6 pt-6">

           
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
                What do you want to achieve?
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Learn to play guitar"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-3 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Description Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
                Describe your goal{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about your goal..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-3 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />
            </div>

            {/* Finish By Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-black dark:text-white">
                Finish by
              </label>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { value: "1w", label: "1w" },
                  { value: "2w", label: "2w" },
                  { value: "1m", label: "1m" },
                  { value: "6m", label: "6m" },
                  { value: "custom", label: "Custom" },
                ].map((period) => (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() =>
                      handlePeriodSelect(
                        period.value as "1w" | "2w" | "1m" | "6m" | "custom",
                      )
                    }
                    className={`
                      aspect-square rounded-full text-sm font-semibold transition-all cursor-pointer
                      flex items-center justify-center
                      ${
                        selectedPeriod === period.value
                          ? "bg-black dark:bg-gray-700 text-white"
                          : "bg-gray-100 dark:bg-dark-3 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
                      }
                    `}
                  >
                    {period.value === "custom" ? (
                      <CalendarDaysIcon className="w-5 h-5" />
                    ) : (
                      period.label
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Picker */}
            {showCalendar && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-black dark:text-white">
                  Select date
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-3 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            )}
             </div>

            <div className="mt-4 p-6 w-full bg-white dark:bg-gray-900  border-t border-gray-200 dark:border-gray-800">
              {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid}
              className={`
                w-full py-3 rounded-2xl font-semibold text-white text-base transition-all
                ${
                  isFormValid
                    ? "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 cursor-pointer active:scale-95"
                    : "bg-gray-300 dark:bg-gray-700 opacity-50 cursor-not-allowed"
                }
              `}
            >
              Create Goal
            </button>

            </div>
            
          </form>
        </div>
      </div>
    </>
  );
}

interface Activity {
  id: string;
  name: string;
  type: ActivityType;
}

export default function GoalsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSessionPopupOpen, setIsSessionPopupOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const ongoing = mockGoals.filter((g) => g.status === "ongoing");
  const planned = mockGoals.filter((g) => g.status === "planned");
  const completed = mockGoals.filter((g) => g.status === "completed");

  const handleCreateGoal = (goal: {
    title: string;
    description: string;
    finishBy: string;
  }) => {
    console.log("New goal created:", goal);
    // Add your logic here to save the goal
    setIsModalOpen(false);
  };

  const handleOpenSessionPopup = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsSessionPopupOpen(true);
  };

  const handleSelectActivity = (activity: Activity) => {
    setIsSessionPopupOpen(false);
    if (selectedGoalId) {
      router.push(
        `/goals/${selectedGoalId}/session/new?activity=${activity.id}`,
      );
    }
  };

  const handleNewActivity = () => {
    setIsSessionPopupOpen(false);
    if (selectedGoalId) {
      // Navigate to goal page which has the full activity modal
      router.push(`/goals/${selectedGoalId}`);
    }                                 
  };

  return (
    <main className="h-screen w-full bg-gray-100 dark:bg-dark-1 overflow-hidden">
      <div className="mx-auto w-full  px-4 py-6">
        <div className="flex w-full gap-6">
          {/* LEFT MAIN CONTENT */}
          <div className="w-full h-screen overflow-scroll noscrollbar py-4 px-6 md:px-12">
            {/* Title */}
            <h1 className="text-xl font-bold text-black dark:text-white mb-4">
              Goals
            </h1>

            {/* Create new goal */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full rounded-2xl cursor-pointer bg-gray-200 dark:bg-dark-2 text-black dark:text-white font-semibold py-4 flex items-center justify-start gap-3 px-5 hover:bg-gray-300 dark:hover:bg-dark-3 transition"
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
                      onClick: () => handleOpenSessionPopup(goal.id),
                    }}
                    secondaryCta={{
                      label: "View Goal",
                      onClick: () => router.push(`/goals/${goal.id}`),
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
                      label: "Discard",
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

      {/* New Goal Modal */}
      <NewGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateGoal}
      />

      {/* New Session Popup */}
      <NewSessionPopup
        isOpen={isSessionPopupOpen}
        onClose={() => setIsSessionPopupOpen(false)}
        onSelectActivity={handleSelectActivity}
        onNewActivity={handleNewActivity}
      />
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
    masteryTextColor: "#9aa0a2",
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
      <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="text-center flex flex-col items-center">
          <div className="flex flex-col items-center">
            <img
              src={user.profile_picture}
              className="h-24 w-24 object-cover aspect-square p-[1.5px] rounded-full"
              loading="lazy"
              alt="Profile"
            />
            <h3 className="font-semibold mt-2 dark:text-white">
              {user.fullname}
            </h3>
          </div>

          <span className="flex gap-1 justify-center items-center cursor-pointer mt-1">
            <button type="button" className="flex cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-gray-400 dark:text-gray-500"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm9.75-5.25a.75.75 0 0 0-.75.75v.75a.75.75 0 0 0 1.5 0V7.5a.75.75 0 0 0-.75-.75Zm0 4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0V12a.75.75 0 0 0-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <p
              className="text-sm font-bold"
              style={{ color: user.masteryTextColor }}
            >
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
          <div className="bg-gray-100 dark:bg-dark-3 w-full flex flex-col rounded-md items-center justify-between p-4">
            <p
              className="text-lg font-bold"
              style={{ color: user.masteryTextColor }}
            >
              {user.totalXp} XP
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Overall ranked <b>#{user.rank}</b>
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-dark-3 w-full flex flex-col rounded-md items-center justify-between p-4">
            <p className="text-sm dark:text-gray-300">Streak Count</p>

            <p className="text-lg font-extrabold text-gray-400 dark:text-gray-500 flex gap-1 items-center">
              <FireIcon
                className={`w-6 h-6 inline-block ml-1 ${
                  user.streak_active
                    ? "text-yellow-500 animate-pulse"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              />
              {user.streak}
            </p>
          </div>
        </div>
      </div>
      <NudgesLikesSection
          interactions={interactions}
        />
    </aside>
  );
}

/* ---------------- SMALL HELPER ---------------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-semibold dark:text-white">{value}</p>
      <p className="text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
