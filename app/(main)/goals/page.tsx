"use client";

import GoalStatusMenu from "@/src/components/goals/GoalStatusMenu";
import StatusChangeConfirmationModal from "@/src/components/goals/StatusChangeConfirmationModal";
import { useAuth } from "@/src/context/AuthContext";
import { useToast, useConfirm } from "@/src/context/ToastContext";
import { usePopup } from "@/src/context/PopupContext";
import { ACTIVITY_META, ActivityType } from "@/src/lib/types/activityMeta";
import { BoltIcon, PlayIcon, PlusIcon, UsersIcon } from "@heroicons/react/24/solid";
import FireIcon from "@heroicons/react/24/solid/FireIcon";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { FaBrain, FaHammer } from "react-icons/fa";

const NewActivityModal = dynamic(
  () => import("@/src/components/goals/NewActivityModel"),
);

type AspectKey = "physique" | "energy" | "social" | "creativity" | "logic";

type GoalStatus = "ongoing" | "planned" | "completed" | "paused" | "abandoned";

// Sunday(0)-indexed week of session activity for an ongoing goal — see
// WeekProgressBars below for how this is rendered.
type WeekProgress = {
  today: number;
  progress: string[];
};

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

  // ongoing-only: this week's per-day session activity
  weekProgress?: WeekProgress;
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
  planned:number;
  completed:number;
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
  id: string;
  uid: string;
  title: string;
  description?: string | null;
  content: string;
  status: GoalStatus;
  emoji?: string | null;
  duration_display?: string | null;
  finish_by?: string | null;
  total_xp?: number;
  xp_distribution?: Record<AspectKey, number>;
  // Present on ongoing goals only.
  week_progress?: WeekProgress;
};

import { NudgesLikesSection } from "@/src/components/goals/NudgesLikesSection";
import { LiveAvatar } from "@/src/components/LiveAvatar";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-black dark:text-[var(--foreground)] mb-3">
      {children}
    </h2>
  );
}

const GOAL_TITLE_MOBILE_MAX_CHARS = 24;

// Mirrors the `md:` Tailwind breakpoint (768px) used to split mobile/desktop
// styling elsewhere in this file — needed here in JS too since the mobile
// title crop is a hard character limit, not CSS truncation.
function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

function GoalCard({
  goal,
  primaryCta,
  secondaryCta,
  showAchievementCta,
  onStatusChange,
  onEdit,
  onDelete,
  spotlightPrimary,
}: {
  goal: Goal;
  primaryCta?: { label: string; onClick: () => void };
  secondaryCta?: { label: string; onClick: () => void };
  showAchievementCta?: { label: string; onClick: () => void };
  onStatusChange?: (goalId: string, newStatus: string) => void;
  onEdit?: (goalId: string) => void;
  onDelete?: (goalId: string) => void;
  /** Marks this card's primary button as the onboarding tour anchor. */
  spotlightPrimary?: boolean;
}) {
  const isCompleted = goal.status === "completed";
  const isMobile = useIsMobileViewport();
  const displayTitle =
    isMobile && goal.title.length > GOAL_TITLE_MOBILE_MAX_CHARS
      ? `${goal.title.slice(0, GOAL_TITLE_MOBILE_MAX_CHARS)}..`
      : goal.title;

  return (
    <div className="w-full flex gap-3">
      <div className="w-full min-w-0 rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2  p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className=" w-full flex items-start gap-3">
            <div className="text-xl leading-none mt-1">{goal.emoji}</div>

            <div className="w-full">
              <div className="flex w-full items-center justify-between gap-2">
                <p className="font-semibold text-lg text-black dark:text-[var(--foreground)] truncate">
                  {displayTitle}
                </p>

                <div className="flex items-center gap-2 shrink-0">
                  {isCompleted && typeof goal.xpReward === "number" && (
                    <span
                      style={{
                        backgroundColor: "var(--rookie-primary)",
                      }}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                    >
                      {goal.xpReward}XP
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3-dot Status Menu */}
          {onStatusChange && onEdit && onDelete && (
            <GoalStatusMenu
              goalId={goal.id}
              currentStatus={goal.status}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          )}

          {/* Right meta */}
          {!isCompleted && goal.metaRight && !onStatusChange && (
            <p className="text-xs text-gray-400 dark:text-[var(--muted)] italic whitespace-nowrap mt-1">
              {goal.metaRight}
            </p>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-[var(--muted)] mt-3 line-clamp-2 min-h-10">
          {goal.description}
        </p>
        {/* Completed extra row */}
        {isCompleted && goal.timeSummary && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-[var(--muted)]">
            <span className="inline-flex items-center justify-center">
              {/* clock icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 text-gray-400 dark:text-[var(--muted)]"
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
          <div className="mt-4 grid grid-cols-5 gap-1 sm:gap-2">
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
              onClick={primaryCta.onClick}
              data-onboarding={spotlightPrimary ? "goal-session-cta" : undefined}
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
              className="flex-1 rounded-xl cursor-pointer bg-gray-700 dark:bg-[var(--dark-3)] text-white font-semibold py-3 hover:bg-gray-800 dark:hover:bg-[var(--dark-3)] transition"
            >
              {secondaryCta.label}
            </button>
          )}

          {showAchievementCta && (
            <button
              onClick={showAchievementCta.onClick}
              className="w-full rounded-xl cursor-pointer bg-gray-700 dark:bg-[var(--dark-3)] text-white font-semibold py-3 hover:bg-gray-800 dark:hover:bg-[var(--dark-3)] transition"
            >
              {showAchievementCta.label}
            </button>
          )}
        </div>
      </div>
      {goal.weekProgress && (
        <WeekProgressBars weekProgress={goal.weekProgress} />
      )}
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
          <div className="h-4 w-4 rounded bg-gray-200 dark:bg-dark-3 mt-1" />

          <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-dark-3" />
        </div>

        {/* meta right */}
        <div className="h-2 w-16 rounded bg-gray-200 dark:bg-dark-3 mt-1" />
      </div>

      {/* description */}
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-gray-200 dark:bg-dark-3" />
      </div>

      {/* buttons */}
      <div className="mt-6 flex gap-3">
        <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-dark-3" />
        <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-dark-3" />
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

// 7 bars, Sunday(0) through Saturday(6). Each day is one of:
// - future (dayIndex > today): empty, bordered only
// - today, no session yet: bg-white/dark-3 with a thicker border
// - today, completed: full-opacity aspect-color bg, no border
// - past, completed: low-opacity aspect-color bg with a full-opacity aspect-color border
// - past, no session: muted, no border
function WeekProgressBars({ weekProgress }: { weekProgress: WeekProgress }) {
  const { today, progress } = weekProgress;

  return (
    <div className="flex py-3 flex-col gap-1.5 shrink-0 self-stretch justify-between ">
      {progress.map((value, dayIndex) => {
        const isFuture = dayIndex > today;
        const isToday = dayIndex === today;
        const aspectKey = value.toLowerCase() as AspectKey;
        const hasValue = value !== "" && aspectKey in ACTIVITY_META;
        const aspectColor = hasValue ? ACTIVITY_META[aspectKey].cssColorVar : undefined;
        const aspectColorRgb = hasValue ? ACTIVITY_META[aspectKey].cssColorVarRgb : undefined;

        let className = "w-2 flex-1 rounded-xs";
        let style: React.CSSProperties | undefined;

        if (isFuture) {
          className += " border bg-gray-50 dark:bg-dark-1 border-gray-300 dark:border-[var(--border)]";
        } else if (isToday && !hasValue) {
          className += " border animate-pulse dark:animate-none bg-white dark:bg-dark-2 border-gray-300 dark:border-gray-500/50";
        } else if (isToday && hasValue) {
          style = { backgroundColor: aspectColor };

        } else if (hasValue) {
          className += " ";
          style = { backgroundColor: `rgba(${aspectColorRgb}, 0.6)`, borderColor:  `rgba(${aspectColorRgb}, 0.5)` };
        } else {
          className += " bg-gray-300 dark:bg-dark-3";
        }

        return <div key={dayIndex} className={className} style={style} />;
      })}
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
import { GoalsService } from "@/src/lib/services/goals";
import posthog from "posthog-js";

interface Activity {
  id: string;
  uid?: string;
  pk?: number;
  name: string;
  type: ActivityType;
  total_xp?: number;
  xp_distribution?: Record<string, number>;
}


function RightSidebarInfoSkeleton() {
  return (
    <aside className="w-[400px] hidden md:block">
      {/* PROFILE CARD */}
      <div className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] animate-pulse">
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
        className="bg-white p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] animate-pulse"
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


export default function GoalsPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalPost | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const { me, loading: authLoading } = useAuth();
  const username = me?.username;

  const [isEmptySession, setIsEmptySession] = useState(false);

  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    goalId: string;
    currentStatus: string;
    newStatus: string;
    goalTitle: string;
  } | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("new") !== "1") return;

    setEditingGoal(null);
    setIsModalOpen(true);
    url.searchParams.delete("new");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      // No client-sent Authorization header — /api/goals reads the httpOnly
      // auth cookie itself (and refreshes it if stale). Gating/authing off
      // the browser Supabase SDK's session was unreliable on mobile, where
      // that client-side session can lag or fail to hydrate even though the
      // cookie is perfectly valid, leaving this query permanently disabled.
      const res = await fetch(`/api/goals`, { cache: "no-store" });

      if (!res.ok) throw new Error("Failed to fetch goals");

      const data = await res.json();
      const results = (Array.isArray(data.results) ? data.results : []) as GoalPost[];
      // TEMP DEBUG: remove after confirming week_progress payload
      console.log("[DEBUG] /api/goals raw results:", results);
      const ongoing = results.find((g) => g.status === "ongoing");
      console.log(
        "[DEBUG] first ongoing goal keys:",
        ongoing ? Object.keys(ongoing) : "no ongoing goal found",
      );
      console.log("[DEBUG] first ongoing goal week_progress:", ongoing?.week_progress);
      return results;
    },
    enabled: !authLoading && !!username,
    // Every create/update/delete/status-change mutation below explicitly
    // invalidates ["goals"], so this can cache generously without risking
    // stale data after a user's own edits.
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const plannedGoals = goals.filter((p) => p.status === "planned");
  const ongoingGoals = goals.filter((p) => p.status === "ongoing");
  const pausedGoals = goals.filter((p) => p.status === "paused");
  const completedGoals = goals.filter((p) => p.status === "completed");
  const abandonedGoals = goals.filter((p) => p.status === "abandoned");
  const getGoalDescription = (goal: GoalPost) =>
    goal.description || goal.content || "";

  const { data: sidebarInfo = null, isLoading: sidebarLoading } = useQuery({
    queryKey: ["goals", "sidebar", username],
    queryFn: async () => {
      // Proxied through /api/goals/info/[username] (httpOnly-cookie auth,
      // same reasoning as the goals list query above) instead of calling
      // Django directly with the browser SDK's session token.
      const res = await fetch(`/api/goals/info/${username}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch sidebar info");

      return (await res.json()) as UserGoalsInfo;
    },
    enabled: !!username,
    // Key is prefixed with "goals", so it's also invalidated by every goal
    // mutation below; kept shorter than the list itself since XP/streak can
    // still change from session completions on other pages.
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const showGoalsSkeleton = goalsLoading && goals.length === 0;
  const showSidebarSkeleton = sidebarLoading && !sidebarInfo;

  const handleOpenCreateGoal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleCreateGoal = async (goal: {
    title: string;
    description: string;
    finishBy: string;
  }) => {
    const tempId = `pending-${Date.now()}`;
    const optimisticGoal: GoalPost = {
      id: tempId,
      uid: tempId,
      title: goal.title,
      description: goal.description,
      content: goal.description,
      status: "planned",
      emoji: "🎯",
    };

    queryClient.setQueryData<GoalPost[]>(["goals"], (currentGoals = []) => [
      optimisticGoal,
      ...currentGoals,
    ]);
    setIsModalOpen(false);

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: goal.title,
          description: goal.description,
          finish_by: goal.finishBy,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create goal");
      }

      const payload = await res.json().catch(() => null);
      const rawGoal =
        payload && typeof payload === "object" && "data" in payload
          ? payload.data
          : payload && typeof payload === "object" && "goal" in payload
            ? payload.goal
            : payload;

      const createdGoal =
        rawGoal && typeof rawGoal === "object"
          ? (rawGoal as Record<string, unknown>)
          : null;
      const createdId =
        typeof createdGoal?.uid === "string" || typeof createdGoal?.uid === "number"
          ? String(createdGoal.uid)
          : typeof createdGoal?.id === "string" || typeof createdGoal?.id === "number"
            ? String(createdGoal.id)
            : tempId;
      const createdDescription =
        typeof createdGoal?.description === "string"
          ? createdGoal.description
          : typeof createdGoal?.content === "string"
            ? createdGoal.content
            : goal.description;
      const createdStatus =
        createdGoal?.status === "ongoing" ||
        createdGoal?.status === "planned" ||
        createdGoal?.status === "completed" ||
        createdGoal?.status === "paused" ||
        createdGoal?.status === "abandoned"
          ? createdGoal.status
          : createdGoal?.status === "active"
            ? "ongoing"
            : "planned";

      queryClient.setQueryData<GoalPost[]>(["goals"], (currentGoals = []) =>
        currentGoals.map((existingGoal) =>
          existingGoal.id === tempId
            ? {
                ...optimisticGoal,
                id: createdId,
                uid: createdId,
                title:
                  typeof createdGoal?.title === "string"
                    ? createdGoal.title
                    : goal.title,
                description: createdDescription,
                content: createdDescription,
                status: createdStatus,
                emoji:
                  typeof createdGoal?.emoji === "string"
                    ? createdGoal.emoji
                    : optimisticGoal.emoji,
                total_xp:
                  typeof createdGoal?.total_xp === "number"
                    ? createdGoal.total_xp
                    : undefined,
                xp_distribution:
                  createdGoal?.xp_distribution &&
                  typeof createdGoal.xp_distribution === "object"
                    ? (createdGoal.xp_distribution as Record<AspectKey, number>)
                    : undefined,
              }
            : existingGoal,
        ),
      );
      posthog.capture("goal_created", { goal_id: createdId, goal_title: goal.title, status: createdStatus });
    } catch (error) {
      queryClient.setQueryData<GoalPost[]>(["goals"], (currentGoals = []) =>
        currentGoals.filter((existingGoal) => existingGoal.id !== tempId),
      );
      console.error("Failed to create goal:", error);
      toast.error("Failed to create goal. Please try again.");
      return;
    }

    // Refetch to reconcile with the server's authoritative shape.
    queryClient.invalidateQueries({ queryKey: ["goals"] });
  };

  const handleOpenEditGoal = (goalId: string) => {
    const goal = goals.find((candidate) => candidate.uid === goalId);
    if (!goal) return;
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleUpdateGoal = async (data: {
    title: string;
    description: string;
    finishBy: string;
  }) => {
    if (!editingGoal) return;

    const goalId = editingGoal.uid;
    setIsModalOpen(false);
    setEditingGoal(null);

    // Optimistic update — show the edited title/description/date on the
    // card immediately instead of waiting on the PATCH + refetch.
    queryClient.setQueryData<GoalPost[]>(["goals"], (prev = []) =>
      prev.map((g) =>
        g.uid === goalId
          ? {
              ...g,
              title: data.title,
              description: data.description,
              ...(data.finishBy ? { finish_by: data.finishBy } : {}),
            }
          : g
      )
    );

    try {
      await GoalsService.updateGoal(goalId, {
        title: data.title,
        description: data.description,
        ...(data.finishBy ? { finish_by: data.finishBy } : {}),
      });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal", goalId] });
    } catch (error) {
      console.error("Failed to update goal:", error);
      toast.error("Failed to update goal. Please try again.");

      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    }
  };

  const getPreferredGoalId = () => {
    const fallbackGoal = goals.find(
      (goal) => goal.status !== "completed" && goal.status !== "abandoned",
    );
    return fallbackGoal?.uid ?? goals[0]?.uid ?? null;
  };

  const handleOpenActivityModal = (goalId: string) => {
    setIsEmptySession(false);
    setSelectedGoalId(goalId);
    setIsActivityModalOpen(true);
  };

  const handleOpenEmptySessionModal = () => {
    setIsEmptySession(true);
    setSelectedGoalId(null);
    setIsActivityModalOpen(true);
  };

  const buildRatesParam = (activity: Activity) => {
    const dist = activity.xp_distribution ?? {};
    const SECONDS_PER_HOUR = 3600;
    const aspects = ['physique', 'energy', 'logic', 'creativity', 'social'] as const;
    const totalXp = aspects.reduce((s, k) => s + (dist[k] ?? 0), 0);
    const rates = totalXp > 0
      ? aspects.reduce((acc, k) => {
          acc[k] = Math.round((dist[k] ?? 0) / SECONDS_PER_HOUR * 10000) / 10000;
          return acc;
        }, {} as Record<string, number>)
      : {};
    return Object.keys(rates).length > 0
      ? `&rates=${encodeURIComponent(JSON.stringify(rates))}`
      : '';
  };

  const handleSelectActivity = (activity: Activity) => {
    setIsActivityModalOpen(false);

    // Django's session register resolves activities by uid, so never send the
    // integer pk — a pk-only reference 400s the register and the session never
    // reaches Django (reflection then 404s).
    const activityRef = activity.uid ?? activity.id;
    const ratesParam = buildRatesParam(activity);

    if (isEmptySession) {
      router.push(`/goals/none/session/new?activity=${activityRef}${ratesParam}`);
      return;
    }

    const goalId = selectedGoalId ?? getPreferredGoalId();
    if (!goalId) {
      toast.info("Create a goal first to start a session.");
      return;
    }

    router.push(`/goals/${goalId}/session/new?activity=${activityRef}${ratesParam}`);
  };

  const handleGenerateNewActivity = (query: string) => {
    setIsActivityModalOpen(false);
    if (selectedGoalId) {
      // Navigate to goal page which has the full activity modal with query for context
      router.push(`/goals/${selectedGoalId}?q=${encodeURIComponent(query)}`);
    }
  };

  const handleDeleteGoal = async (goalUid: string) => {
    try {
      setDeletingGoalId(goalUid);

      // Optimistically remove from UI
      const goalToDelete = goals.find(g => g.uid === goalUid);
      queryClient.setQueryData<GoalPost[]>(["goals"], (prev = []) =>
        prev.filter(g => g.uid !== goalUid),
      );

      const res = await fetch(`/api/goals/${goalUid}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Restore goal on error
        if (goalToDelete) {
          queryClient.setQueryData<GoalPost[]>(["goals"], (prev = []) => [
            ...prev,
            goalToDelete,
          ]);
        }

        if (res.status === 401) {
          toast.error("Session expired. Please log in again.");
          router.push("/users/login");
          return;
        }

        const errorData = await res.json().catch(() => ({ detail: "Failed to delete goal" }));
        toast.error(errorData.detail || "Failed to delete goal.");
        return;
      }

      // Success - goal already removed from UI
      posthog.capture("goal_deleted", { goal_id: goalUid });
      // The goal detail page (and its session list) may still have this
      // goal cached — a stale copy there would otherwise keep showing a
      // goal that no longer exists.
      queryClient.invalidateQueries({ queryKey: ["goal", goalUid] });
      if (username) {
        queryClient.invalidateQueries({ queryKey: ["profile-stats", username] });
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      posthog.captureException(error);
      toast.error("An error occurred while deleting the goal.");

      // Refresh goals list on error
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    } finally {
      setDeletingGoalId(null);
    }
  };

  const handleDeleteGoalRequest = async (goalId: string) => {
    if (deletingGoalId) return; // Prevent multiple clicks
    const goal = goals.find((g) => g.uid === goalId);
    const ok = await confirm({
      title: "Delete goal",
      message: `Are you sure you want to delete "${goal?.title ?? "this goal"}"? This cannot be undone.`,
      confirmText: "Delete",
      destructive: true,
    });
    if (ok) {
      handleDeleteGoal(goalId);
    }
  };

  const handleStatusChangeRequest = (goalId: string, newStatus: string) => {
    const goal = goals.find((g) => g.uid === goalId);
    if (!goal) return;

    setPendingStatusChange({
      goalId,
      currentStatus: goal.status,
      newStatus,
      goalTitle: goal.title,
    });
    setIsStatusConfirmOpen(true);
  };

  const handleStatusChangeConfirm = async () => {
    if (!pendingStatusChange) return;

    try {
      // Optimistic update
      queryClient.setQueryData<GoalPost[]>(["goals"], (prev = []) =>
        prev.map((g) =>
          g.uid === pendingStatusChange.goalId
            ? { ...g, status: pendingStatusChange.newStatus as GoalStatus }
            : g
        )
      );

      // API call
      await GoalsService.updateGoal(pendingStatusChange.goalId, {
        status: pendingStatusChange.newStatus,
      });

      posthog.capture("goal_status_changed", {
        goal_id: pendingStatusChange.goalId,
        from_status: pendingStatusChange.currentStatus,
        to_status: pendingStatusChange.newStatus,
      });

      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      // The goal detail page caches this same goal separately, and
      // profile-stats' ongoingGoals list depends on status too.
      queryClient.invalidateQueries({
        queryKey: ["goal", pendingStatusChange.goalId],
      });
      if (username) {
        queryClient.invalidateQueries({ queryKey: ["profile-stats", username] });
      }
    } catch (error) {
      console.error("Failed to update goal status:", error);
      toast.error("Failed to update goal status. Please try again.");

      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    } finally {
      setPendingStatusChange(null);
      setIsStatusConfirmOpen(false);
    }
  };

  return (
    <main className="h-screen w-full bg-gray-100 dark:bg-dark-1 overflow-hidden">
      <div className="mx-auto w-full px-2 py-6 md:px-4">
        <div className="flex w-full gap-6">
          {/* LEFT MAIN CONTENT */}
          <div className="flex-1 md:w-[90%] lg:w-[60%] h-screen overflow-scroll noscrollbar py-4 px-3 md:px-12">
            {/* Title */}
            <h1 className="text-xl font-bold text-black dark:text-[var(--foreground)] mb-4">
              Goals
            </h1>

            <div className="flex mt-3 gap-3">
              {/* Create new goal */}
              <button
                type="button"
                data-onboarding="goals-empty-session"
                onClick={handleOpenEmptySessionModal}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gray-200 dark:bg-dark-2 text-black dark:text-[var(--foreground)] font-semibold py-4 px-5 hover:bg-gray-300 dark:hover:bg-dark-3 transition cursor-pointer"
              >
                <PlayIcon className="w-5 h-5" />
                <span>Free Session</span>
              </button>
              <button
                type="button"
                data-onboarding="goals-create"
                onClick={handleOpenCreateGoal}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gray-200 dark:bg-dark-2 text-black dark:text-[var(--foreground)] font-semibold py-4 px-5 hover:bg-gray-300 dark:hover:bg-dark-3 transition cursor-pointer"
              >
                <PlusIcon className="w-5 h-5" />
                <span>New Goal</span>
              </button>
            </div>

            {!showGoalsSkeleton && goals.length === 0 ? (
              <div className="mt-12 flex flex-col items-center justify-center text-center py-16 px-6 ">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-dark-3 flex items-center justify-center mb-4">
                  <RocketLaunchIcon className="w-8 h-8 text-gray-500 dark:text-[var(--muted)]" />
                </div>
                <h3 className="text-lg font-bold text-black dark:text-[var(--foreground)] mb-1">
                  No goals yet? let&apos;s change that
                </h3>
                <p className="text-sm text-gray-500 dark:text-[var(--muted)] max-w-xs">
                  Every big achievement starts with a single goal. Create your first one and start earning XP today.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateGoal}
                  className="mt-5 flex items-center gap-2 rounded-2xl bg-[var(--rookie-primary)]  text-white font-semibold py-3 px-6 hover:opacity-90 transition cursor-pointer"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Create Your First Goal</span>
                </button>
              </div>
            ) : (
              <>
            {/* Ongoing */}
            <div className="mt-6">
              {(ongoingGoals.length > 0 || showGoalsSkeleton) && (
                <>
                  <SectionTitle>Ongoing ({ongoingGoals.length})</SectionTitle>
                </>
              )}
              {showGoalsSkeleton ? (
                <>
                  <GoalsSectionSkeleton count={2} />
                </>
              ) : (
                <div className="space-y-4 animate-content-in">
                  {ongoingGoals.map((goal, index) => (
                    <GoalCard
                      key={goal.id}
                      spotlightPrimary={index === 0}
                      goal={{
                        id: goal.uid,
                        emoji: goal.emoji || "🎯",
                        title: goal.title,
                        description: getGoalDescription(goal),
                        status: "ongoing",
                        metaRight: goal.duration_display
                          ? `${goal.duration_display} spent`
                          : undefined,
                        weekProgress: goal.week_progress,
                      }}
                      primaryCta={{
                        label: "New Session",
                        onClick: () => handleOpenActivityModal(goal.uid),
                      }}
                      secondaryCta={{
                        label: "View",
                        onClick: () => router.push(`/goals/${goal.uid}`),
                      }}
                      onStatusChange={handleStatusChangeRequest}
                      onEdit={handleOpenEditGoal}
                      onDelete={handleDeleteGoalRequest}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Planned */}
            <div className="mt-6">
              {(plannedGoals.length > 0 || showGoalsSkeleton) && (
                <>
                  <SectionTitle>Planned ({plannedGoals.length})</SectionTitle>
                </>
              )}

              {showGoalsSkeleton ? (
                <>
                  <GoalsSectionSkeleton count={2} />
                </>
              ) : (
                <div className="space-y-4 animate-content-in">
                  {plannedGoals.map((goal, index) => (
                    <GoalCard
                      key={goal.id}
                      spotlightPrimary={index === 0 && ongoingGoals.length === 0}
                      goal={{
                        id: goal.uid,
                        emoji: goal.emoji || "🎯",
                        title: goal.title,
                        description: getGoalDescription(goal),
                        status: "planned",
                        metaRight: "Planned",
                        weekProgress: goal.week_progress,
                      }}
                      primaryCta={{
                        label: "Start",
                        onClick: () => handleOpenActivityModal(goal.uid),
                      }}
                      secondaryCta={{
                        label: deletingGoalId === goal.uid ? "Deleting..." : "Discard",
                        onClick: async () => {
                          if (deletingGoalId) return; // Prevent multiple clicks
                          const ok = await confirm({
                            title: "Discard goal",
                            message: `Are you sure you want to discard "${goal.title}"?`,
                            confirmText: "Discard",
                            destructive: true,
                          });
                          if (ok) {
                            handleDeleteGoal(goal.uid);
                          }
                        },
                      }}
                      onStatusChange={handleStatusChangeRequest}
                      onEdit={handleOpenEditGoal}
                      onDelete={handleDeleteGoalRequest}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Completed */}
            <div className="mt-6">
              {(completedGoals.length > 0 || showGoalsSkeleton) && (
                <>
                  <SectionTitle>
                    Completed ({completedGoals.length})
                  </SectionTitle>
                </>
              )}
              {showGoalsSkeleton ? (
                <>
                  <GoalsSectionSkeleton count={2} />
                </>
              ) : (
                <div className="space-y-4 animate-content-in">
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={{
                        id: goal.uid,
                        emoji: goal.emoji || "🎯",
                        title: goal.title,
                        description: getGoalDescription(goal),
                        status: "completed",
                        xpReward: goal.total_xp,
                        timeSummary: goal.duration_display
                          ? goal.duration_display
                          : undefined,
                        aspectXP: goal.xp_distribution,
                      }}
                      showAchievementCta={{
                        label: "View Achievement",
                        onClick: () => router.push(`/goals/${goal.uid}`),
                      }}
                      onStatusChange={handleStatusChangeRequest}
                      onEdit={handleOpenEditGoal}
                      onDelete={handleDeleteGoalRequest}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Paused */}
            <div className="mt-6">
              {(pausedGoals.length > 0 || showGoalsSkeleton) && (
                <>
                  <SectionTitle>Paused ({pausedGoals.length})</SectionTitle>
                </>
              )}
              {showGoalsSkeleton ? (
                <>
                  <GoalsSectionSkeleton count={1} />
                </>
              ) : (
                <div className="space-y-4 animate-content-in">
                  {pausedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={{
                        id: goal.uid,
                        emoji: goal.emoji || "🎯",
                        title: goal.title,
                        description: getGoalDescription(goal),
                        status: "paused",
                        metaRight: goal.duration_display
                          ? `${goal.duration_display} spent`
                          : undefined,
                      }}
                      primaryCta={{
                        label: "Resume",
                        onClick: () => handleStatusChangeRequest(goal.uid, 'ongoing'),
                      }}
                      secondaryCta={{
                        label: "View",
                        onClick: () => router.push(`/goals/${goal.uid}`),
                      }}
                      onStatusChange={handleStatusChangeRequest}
                      onEdit={handleOpenEditGoal}
                      onDelete={handleDeleteGoalRequest}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Abandoned */}
            <div className="mt-6">
              {(abandonedGoals.length > 0 || showGoalsSkeleton) && (
                <>
                  <SectionTitle>Abandoned ({abandonedGoals.length})</SectionTitle>
                </>
              )}
              {showGoalsSkeleton ? (
                <>
                  <GoalsSectionSkeleton count={1} />
                </>
              ) : (
                <div className="space-y-4 animate-content-in">
                  {abandonedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={{
                        id: goal.uid,
                        emoji: goal.emoji || "🎯",
                        title: goal.title,
                        description: getGoalDescription(goal),
                        status: "abandoned",
                        metaRight: goal.duration_display
                          ? `${goal.duration_display} spent`
                          : undefined,
                      }}
                      showAchievementCta={{
                        label: "View",
                        onClick: () => router.push(`/goals/${goal.uid}`),
                      }}
                      onStatusChange={handleStatusChangeRequest}
                      onEdit={handleOpenEditGoal}
                      onDelete={handleDeleteGoalRequest}
                    />
                  ))}
                </div>
              )}
            </div>
              </>
            )}

            <div className="h-8" />
          </div>

          {/* RIGHT SIDEBAR (DESKTOP ONLY) */}
          {showSidebarSkeleton || !sidebarInfo ? (
            <RightSidebarInfoSkeleton />
          ) : (
            <RightSidebar user={sidebarInfo} />
          )}
        </div>
      </div>

      {/* New Goal Modal */}
      <NewGoalModal
        key={editingGoal?.uid ?? "new-goal"}
        isOpen={isModalOpen}
        isEdit={editingGoal !== null}
        goalCompleted={editingGoal?.status === "completed"}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
        initialGoal={
          editingGoal
            ? {
                title: editingGoal.title,
                description: getGoalDescription(editingGoal),
                finishBy: editingGoal.finish_by ?? "",
              }
            : undefined
        }
      />

      {/* New Activity Modal */}
      <NewActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSelectActivity={handleSelectActivity}
        onGenerateNew={handleGenerateNewActivity}
        goalUid={selectedGoalId}
      />

      {/* Status Change Confirmation Modal */}
      <StatusChangeConfirmationModal
        isOpen={isStatusConfirmOpen}
        onClose={() => {
          setIsStatusConfirmOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={handleStatusChangeConfirm}
        currentStatus={pendingStatusChange?.currentStatus || ''}
        newStatus={pendingStatusChange?.newStatus || ''}
        goalTitle={pendingStatusChange?.goalTitle || ''}
      />
    </main>
  );
}

/* ===========================
   RIGHT SIDEBAR (APPENDED)
   =========================== */

   function RecentInteractionsSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-2 w-full p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-[var(--border)] animate-pulse">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 w-40 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        <ul className="flex flex-col gap-4">
          
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex gap-4">
              
              {/* Avatar */}
              <div className="relative w-12 h-12 flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-[var(--dark-2)]" />
                
                {/* small interaction bubble */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-300 dark:bg-[var(--dark-3)] border border-gray-200 dark:border-[var(--border)]" />
              </div>

              {/* Text content */}
              <div className="flex flex-col flex-1 gap-2">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
                <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
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
    <aside className="w-[400px] hidden md:block">
      {/* PROFILE CARD */}
      <div className="bg-white dark:bg-dark-2 p-6 mb-4 rounded-xl border-2 border-gray-200 dark:border-[var(--border)]">
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
                className="w-4 h-4 text-gray-400 dark:text-[var(--muted)]"
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
            <p className="text-xs text-gray-500 dark:text-[var(--muted)]">
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

/* ---------------- SMALL HELPER ---------------- */

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-semibold dark:text-[var(--foreground)]">{value}</p>
      <p className="text-gray-500 dark:text-[var(--muted)]">{label}</p>
    </div>
  );
}
