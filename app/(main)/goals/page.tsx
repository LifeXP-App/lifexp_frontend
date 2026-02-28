"use client";

import NewActivityModal from "@/src/components/goals/NewActivityModel";
import { useAuth } from "@/src/context/AuthContext";
import { usePopup } from "@/src/context/PopupContext";
import { ActivityType } from "@/src/lib/types/activityMeta";
import { BoltIcon, UsersIcon } from "@heroicons/react/24/solid";
import FireIcon from "@heroicons/react/24/solid/FireIcon";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaBrain, FaHammer } from "react-icons/fa";

type AspectKey = "physique" | "energy" | "social" | "creativity" | "logic";

type GoalStatus =
  | "active"
  | "ongoing"
  | "completed"
  | "planned"
  | "paused"
  | "abandoned";

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

type UserGoalsInfo = {
  username: string;
  fullname: string;
  profile_picture: string;
  mastery: string;
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

type GoalPost = {
  id: number;
  uid: string;
  title: string;
  content: string;
  emoji?: string | null;
  status: GoalStatus;
  duration_display?: string;
  xp_distribution?: {
    physique: number;
    energy: number;
    social: number;
    creativity: number;
    logic: number;
  };
  total_xp?: number;
};

function extractGoalsFromResponse(data: unknown): GoalPost[] {
  const normalizeStatus = (status: unknown): GoalStatus => {
    if (status === "ongoing") return "ongoing";
    if (status === "planned") return "planned";
    if (status === "completed") return "completed";
    if (status === "paused") return "paused";
    if (status === "abandoned") return "abandoned";
    return "active";
  };

  const normalizeGoal = (item: unknown): GoalPost | null => {
    if (!item || typeof item !== "object") return null;

    const goal = item as Record<string, unknown>;
    const rawId = goal.id;
    const rawTitle =
      typeof goal.title === "string"
        ? goal.title
        : typeof goal.content === "string"
          ? goal.content
          : null;

    if ((typeof rawId !== "string" && typeof rawId !== "number") || !rawTitle) {
      return null;
    }

    return {
      id: String(rawId),
      title: rawTitle,
      description:
        typeof goal.description === "string"
          ? goal.description
          : typeof goal.content === "string"
            ? goal.content
            : null,
      status: normalizeStatus(goal.status),
      emoji: typeof goal.emoji === "string" ? goal.emoji : null,
      days_total: typeof goal.days_total === "number" ? goal.days_total : 0,
      days_completed:
        typeof goal.days_completed === "number"
          ? goal.days_completed
          : undefined,
      created_at:
        typeof goal.created_at === "string" ? goal.created_at : undefined,
      updated_at:
        typeof goal.updated_at === "string" ? goal.updated_at : undefined,
    };
  };

  const normalizeList = (items: unknown[]): GoalPost[] => {
    return items
      .map((item) => normalizeGoal(item))
      .filter((goal): goal is GoalPost => goal !== null);
  };

  if (Array.isArray(data)) {
    return normalizeList(data);
  }

  if (data && typeof data === "object" && "data" in data) {
    const nestedData = (data as { data: unknown }).data;
    if (Array.isArray(nestedData)) {
      return normalizeList(nestedData);
    }
    if (
      nestedData &&
      typeof nestedData === "object" &&
      "results" in nestedData &&
      Array.isArray((nestedData as { results: unknown }).results)
    ) {
      return normalizeList((nestedData as { results: unknown[] }).results);
    }
  }

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    return normalizeList((data as { results: unknown[] }).results);
  }

  if (
    data &&
    typeof data === "object" &&
    "goals" in data &&
    Array.isArray((data as { goals: unknown }).goals)
  ) {
    return normalizeList((data as { goals: unknown[] }).goals);
  }

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items: unknown }).items)
  ) {
    return normalizeList((data as { items: unknown[] }).items);
  }

  return [];
}

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
    image:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1755709015/ysyanmka88fuxudiuqhg.jpg",
    username: "alex",
    type: "nudge",
    activityName: "drawing session",
    date: "2m ago",
    href: "/goal/1",
    rounded: true,
  },
  {
    id: "2",
    image:
      "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1755709015/ysyanmka88fuxudiuqhg.jpg",
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
  onCardClick,
}: {
  goal: Goal;
  primaryCta?: { label: string; onClick: () => void };
  secondaryCta?: { label: string; onClick: () => void };
  showAchievementCta?: { label: string; onClick: () => void };
  onCardClick?: () => void;
}) {
  const isCompleted = goal.status === "completed";

  return (
    <div
      className={`w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-2 p-4 ${onCardClick ? "cursor-pointer" : ""}`}
      onClick={onCardClick}
    >
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
            icon={<BiDumbbell className="w-4 h-4" />}
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
            onClick={(e) => {
              e.stopPropagation();
              primaryCta.onClick();
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              secondaryCta.onClick();
            }}
            className="flex-1 rounded-xl cursor-pointer bg-gray-700 dark:bg-gray-600 text-white font-semibold py-3 hover:bg-gray-800 dark:hover:bg-gray-700 transition"
          >
            {secondaryCta.label}
          </button>
        )}

        {showAchievementCta && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              showAchievementCta.onClick();
            }}
            className="w-full rounded-xl bg-gray-700 dark:bg-gray-600 text-white font-semibold py-3 hover:bg-gray-800 dark:hover:bg-gray-700 transition"
          >
            {showAchievementCta.label}
          </button>
        )}
      </div>
    </div>
  );
}
function GoalCardSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-2 p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 w-full">
          {/* emoji placeholder */}
          <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800 mt-1" />

          <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* meta right */}
        <div className="h-2 w-16 rounded bg-gray-200 dark:bg-gray-800 mt-1" />
      </div>

      {/* description */}
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* buttons */}
      <div className="mt-6 flex gap-3">
        <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}

function GoalsSectionSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="mt-6">
      <div className="space-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <GoalCardSkeleton key={i} />
        ))}
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

import NewGoalModal from "@/src/components/goals/NewGoalModal";
import { BiDumbbell } from "react-icons/bi";

interface Activity {
  id: string;
  name: string;
  type: ActivityType;
}

function RightSidebarInfoSkeleton() {
  return (
    <aside className="w-2xl hidden md:block">
      {/* PROFILE CARD */}
      <div className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-gray-800 animate-pulse">
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

      <RecentInteractionsSkeleton />
    </aside>
  );
}

export default function GoalsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const { me, loading: authLoading } = useAuth();

  const [goals, setGoals] = useState<GoalPost[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !me) return;

    const fetchGoals = async () => {
      try {
        setGoalsLoading(true);

        const res = await fetch(`/api/goals`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch goals");

        const data = await res.json();
        setGoals(extractGoalsFromResponse(data));
      } catch (e) {
        console.error(e);
      } finally {
        setGoalsLoading(false);
      }
    };

    fetchGoals();
  }, [me, authLoading]);

  const plannedGoals = goals.filter(
    (p) =>
      p.status === "planned" ||
      p.status === "paused" ||
      p.status === "abandoned",
  );
  const ongoingGoals = goals.filter(
    (p) => p.status === "active" || p.status === "ongoing",
  );
  const completedGoals = goals.filter((p) => p.status === "completed");

  const [sidebarInfo, setSidebarInfo] = useState<UserGoalsInfo | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(false);

  useEffect(() => {
    if (!me?.username) return;

    const fetchSidebarInfo = async () => {
      try {
        setSidebarLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        const res = await fetch(
          `${baseUrl}/api/v1/goals/info/${me.username}/`,
          {
            cache: "no-store",
          },
        );

        if (!res.ok) throw new Error("Failed to fetch sidebar info");

        const data = await res.json();
        setSidebarInfo(data);
      } catch (e) {
        console.error(e);
      } finally {
        setSidebarLoading(false);
      }
    };

    fetchSidebarInfo();
  }, [me?.username]);

  const handleCreateGoal = async (goal: {
    title: string;
    description: string;
    finishBy: string;
  }) => {
    try {
      setIsModalOpen(false);
      setGoalsLoading(true);

      const payload: {
        title: string;
        description?: string;
        finish_by?: string;
      } = { title: goal.title };
      if (goal.description) payload.description = goal.description;
      if (goal.finishBy) payload.finish_by = goal.finishBy;

      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          router.push("/users/login");
          return;
        }
        // Try to parse detailed error if available
        let errorMsg = "Failed to create goal";
        try {
          const errorData = await res.json();
          if (errorData.detail) errorMsg = errorData.detail;
          else if (typeof errorData === "object") {
            // Might be a field-level error object
            errorMsg = JSON.stringify(errorData);
          }
        } catch {
          // ignore parsing error
        }
        throw new Error(errorMsg);
      }

      // Success, refresh list
      if (me) {
        const fetchRes = await fetch(`/api/goals`, { cache: "no-store" });
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          setGoals(extractGoalsFromResponse(data));
        }
      }
    } catch (error: unknown) {
      console.error("Error creating goal:", error);
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while creating the goal";
      alert(message);
      // Could consider reopening modal, or let user click it again
    } finally {
      setGoalsLoading(false);
    }
  };

  const handleOpenActivityModal = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsActivityModalOpen(true);
  };

  const handleSelectActivity = (activity: Activity) => {
    setIsActivityModalOpen(false);
    if (selectedGoalId) {
      router.push(
        `/goals/${selectedGoalId}/session/new?activity=${activity.id}`,
      );
    }
  };

  const handleGenerateNewActivity = () => {
    setIsActivityModalOpen(false);
    if (selectedGoalId) {
      // Navigate to goal page which has the full activity modal
      router.push(`/goals/${selectedGoalId}`);
    }
  };

  const handleStartDrawing = () => {
    setIsActivityModalOpen(false);
    if (selectedGoalId) {
      router.push(`/goals/${selectedGoalId}`);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      setDeletingGoalId(goalId);

      // Optimistically remove from UI
      const goalToDelete = goals.find((g) => g.id === goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));

      const res = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Restore goal on error
        if (goalToDelete) {
          setGoals((prev) => [...prev, goalToDelete]);
        }

        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          router.push("/users/login");
          return;
        }

        const errorData = await res
          .json()
          .catch(() => ({ detail: "Failed to delete goal" }));
        alert(errorData.detail || "Failed to delete goal");
        return;
      }

      // Success - goal already removed from UI
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("An error occurred while deleting the goal");

      // Refresh goals list on error
      if (me) {
        const res = await fetch(`/api/goals`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setGoals(extractGoalsFromResponse(data));
        }
      }
    } finally {
      setDeletingGoalId(null);
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
              {(ongoingGoals.length > 0 || goalsLoading) && (
                <>
                  <SectionTitle>Ongoing ({ongoingGoals.length})</SectionTitle>
                </>
              )}
              {goalsLoading ? (
                <>
                  <GoalsSectionSkeleton count={2} />
                </>
              ) : (
                <div className="space-y-4">
                  {ongoingGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      onCardClick={() => router.push(`/goals/${goal.id}`)}
                      goal={{
                        id: goal.id,
                        emoji: goal.emoji || "🎯",
                        title: goal.title,
                        description: goal.description || "",
                        status: goal.status,
                        metaRight:
                          typeof goal.days_completed === "number"
                            ? `${goal.days_completed}/${goal.days_total} days`
                            : `${goal.days_total} days target`,
                      }}
                      primaryCta={{
                        label: "New Session",
                        onClick: () => router.push(`/goals/${goal.id}`),
                      }}
                      secondaryCta={{
                        label: "View",
                        onClick: () => router.push(`/goals/${goal.id}`),
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Planned */}
            <div className="mt-6">
              {(plannedGoals.length > 0 || goalsLoading) && (
                <>
                  <SectionTitle>Planned ({plannedGoals.length})</SectionTitle>
                </>
              )}

              {goalsLoading ? (
                <>
                  <GoalsSectionSkeleton count={2} />
                </>
              ) : (
                <div className="space-y-4">
                  {plannedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      onCardClick={() => router.push(`/goals/${goal.id}`)}
                      goal={{
                        id: goal.id,
                        emoji: goal.emoji || "🎯",
                        title: goal.title,
                        description: goal.description || "",
                        status: goal.status,
                        metaRight:
                          goal.status === "paused"
                            ? "Paused"
                            : goal.status === "abandoned"
                              ? "Abandoned"
                              : "Planned",
                      }}
                      primaryCta={{
                        label: "Start",
                        onClick: () => handleOpenActivityModal(goal.id),
                      }}
                      secondaryCta={{
                        label:
                          deletingGoalId === goal.id
                            ? "Deleting..."
                            : "Discard",
                        onClick: () => {
                          if (deletingGoalId) return; // Prevent multiple clicks
                          if (
                            window.confirm(
                              `Are you sure you want to discard "${goal.title}"?`,
                            )
                          ) {
                            handleDeleteGoal(goal.id);
                          }
                        },
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Completed */}
            <div className="mt-6">
              {(completedGoals.length > 0 || goalsLoading) && (
                <>
                  <SectionTitle>
                    Completed ({completedGoals.length})
                  </SectionTitle>
                </>
              )}
              {goalsLoading ? (
                <>
                  <GoalsSectionSkeleton count={2} />
                </>
              ) : (
                <div className="space-y-4">
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      onCardClick={() => router.push(`/goals/${goal.id}`)}
                      goal={{
                        id: String(goal.id),
                        emoji: goal.emoji || "🎯",
                        title: goal.title,
                        description: goal.content || "",
                        status: goal.status,

                        timeSummary: goal.duration_display ?? "",

                        xpReward: goal.total_xp ?? 0,

                        aspectXP: goal.xp_distribution
                          ? {
                              physique: goal.xp_distribution.physique ?? 0,
                              energy: goal.xp_distribution.energy ?? 0,
                              social: goal.xp_distribution.social ?? 0,
                              creativity: goal.xp_distribution.creativity ?? 0,
                              logic: goal.xp_distribution.logic ?? 0,
                            }
                          : undefined,
                      }}
                      showAchievementCta={{
                        label: "View Achievement",
                        onClick: () => router.push(`/goals/${goal.id}`),
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="h-8" />
          </div>

          {/* RIGHT SIDEBAR (DESKTOP ONLY) */}
          {sidebarLoading || !sidebarInfo ? (
            <RightSidebarInfoSkeleton />
          ) : (
            <RightSidebar user={sidebarInfo} />
          )}
        </div>
      </div>

      {/* New Goal Modal */}
      <NewGoalModal
        isOpen={isModalOpen}
        isEdit={false}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateGoal}
      />

      {/* New Activity Modal */}
      <NewActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSelectActivity={handleSelectActivity}
        onGenerateNew={handleGenerateNewActivity}
        onStartDrawing={handleStartDrawing}
      />
    </main>
  );
}

/* ===========================
   RIGHT SIDEBAR (APPENDED)
   =========================== */

function RecentInteractionsSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-2 w-full p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        <ul className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex gap-4">
              {/* Avatar */}
              <div className="relative w-12 h-12 shrink-0">
                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800" />

                {/* small interaction bubble */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 border border-gray-200 dark:border-gray-800" />
              </div>

              {/* Text content */}
              <div className="flex flex-col flex-1 gap-2">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RightSidebar({ user }: { user: UserGoalsInfo }) {
  const { openMasteryPopup } = usePopup();
  return (
    <aside className="w-2xl hidden md:block">
      {/* PROFILE CARD */}
      <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-gray-800">
        <div className="text-center flex flex-col items-center">
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
                onClick={openMasteryPopup}
                className="w-4 h-4 text-gray-400 dark:text-gray-500"
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
              style={{ color: user.masteryTextColor }}
            >
              {user.mastery}
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
      <NudgesLikesSection interactions={interactions} />
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
