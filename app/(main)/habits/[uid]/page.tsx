"use client";

import { useAuth } from "@/src/context/AuthContext";
import { useToast, useConfirm } from "@/src/context/ToastContext";
import { playCrack, playHiss } from "@/src/lib/utils/freezeSounds";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { GoalsRightSidebar } from "@/src/components/goals/GoalsRightSidebar";
import { ACTIVITY_META, ActivityType } from "@/src/lib/types/activityMeta";
import type { ClockType } from "@/src/components/goals/PickTimerModePopup";
import { LinkIcon } from "@heroicons/react/24/solid";
import { FaSnowflake } from "react-icons/fa";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

const PickTimerModePopup = dynamic(
  () => import("@/src/components/goals/PickTimerModePopup"),
);
const EditHabitModal = dynamic(
  () => import("@/src/components/goals/EditHabitModal"),
);

type StrengthTier = "dormant" | "light" | "steady" | "strong";

type WeekProgress = {
  today: number;
  progress: boolean[];
};

type Habit = {
  id: number;
  activity_uid: string;
  activity_name: string;
  activity_type: ActivityType;
  activity_emoji: string;
  custom_name: string | null;
  display_name: string;
  is_active: boolean;
  is_frozen: boolean;
  created_at: string;
  last_session_at: string | null;
  strength_score: number;
  strength_tier: StrengthTier;
  qualifying_days: number[];
  weeks_observed: number;
  next_predicted_occurrence: string | null;
  week_progress: WeekProgress;
  daily_stats: Record<string, { xp: number; seconds: number }>;
};

// Opacity scales linearly with XP and caps at 1 once a day hits this much --
// 25xp -> 10%, 125xp -> 50%, 250xp -> 100%, matching the ratios exactly.
const DAILY_XP_FOR_FULL_OPACITY = 250;

// Frozen habits get a cyan theme everywhere (matches the habits list).
const FROZEN_COLOR = "#06b6d4";
// How long accent colors take to fade when the habit is frozen/unfrozen.
const FREEZE_FADE_MS = 4000;

// Freeze/Unfreeze button: secondary (gray) while the habit is active,
// primary (cyan fill, set via inline style) when frozen.
// The cyan fill is a separate overlay (see FreezeButtonFill) so it can fade
// in/out over the gray base instead of snapping.
const freezeButtonClass = () =>
  "relative overflow-hidden flex items-center justify-center gap-2 py-3 rounded-2xl text-md bg-gray-700 dark:bg-dark-3 font-medium text-white text-base transition-all active:opacity-80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

function FreezeButtonFill({ frozen }: { frozen: boolean }) {
  return (
    <span
      aria-hidden
      className="absolute inset-0"
      style={{
        backgroundColor: FROZEN_COLOR,
        opacity: frozen ? 1 : 0,
        transition: `opacity ${FREEZE_FADE_MS}ms ease`,
      }}
    />
  );
}

// false on first paint when `active`, true one frame later -- lets a newly
// mounted element start from one look and CSS-transition to its real one.
function useSettled(active: boolean) {
  const [settled, setSettled] = useState(!active);
  useEffect(() => {
    if (!active) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setSettled(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [active]);
  return settled;
}

// Text/icon that fades from muted gray to `color` over FREEZE_FADE_MS when it
// mounts with `animate` (used when a freeze toggle swaps the Next-day tile).
function FadeInColor({
  color,
  animate,
  className,
  children,
}: {
  color: string;
  animate: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const settled = useSettled(animate);
  return (
    <span
      className={className}
      style={{ color: settled ? color : "var(--muted)", transition: `color ${FREEZE_FADE_MS}ms ease` }}
    >
      {children}
    </span>
  );
}

const STRENGTH_TIER_LABEL: Record<StrengthTier, string> = {
  dormant: "Dormant",
  light: "Weak",
  steady: "Steady",
  strong: "Strong",
};

const STRENGTH_TIER_BARS: Record<StrengthTier, number> = {
  dormant: 0,
  light: 1,
  steady: 2,
  strong: 3,
};

export default function HabitDetailPage() {
  const params = useParams<{ uid: string }>();
  const uid = params.uid;
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { loading: authLoading } = useAuth();

  const [pendingStart, setPendingStart] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFreezing, setIsFreezing] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: habit, isLoading: habitLoading, isError: habitError } = useQuery({
    queryKey: ["habits", "byActivityUid", uid],
    queryFn: async () => {
      const res = await authedFetch(`/api/activities/${uid}/habit`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch habit");
      return (await res.json()) as Habit;
    },
    enabled: !authLoading && !!uid,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const showSkeleton = habitLoading && !habit;
  const isFrozen = !!habit?.is_frozen;
  // Accent color for the whole page: cyan while frozen, else the aspect color.
  const realAspectColor = habit ? ACTIVITY_META[habit.activity_type].cssColorVar : undefined;
  const aspectColor = isFrozen ? FROZEN_COLOR : realAspectColor;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const handleSaveHabitName = async (habitId: number, customName: string) => {
    setIsSaving(true);
    try {
      const res = await authedFetch(`/api/habits/${habitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_name: customName || null }),
      });
      if (!res.ok) throw new Error("Failed to update habit");
      queryClient.invalidateQueries({ queryKey: ["habits", "byActivityUid", uid] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setIsEditOpen(false);
      toast.success("Habit updated.");
    } catch {
      toast.error("Failed to update habit. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHabit = async () => {
    if (!habit) return;
    const ok = await confirm({
      title: "Delete habit",
      message: `Are you sure you want to stop tracking "${habit.display_name}"? This cannot be undone.`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;

    setIsDeleting(true);
    try {
      const res = await authedFetch(`/api/activities/${habit.activity_uid}/habit`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete habit");
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit deleted.");
      router.push("/habits");
    } catch {
      toast.error("Failed to delete habit. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartWithMode = (clockType: ClockType, durationSeconds: number) => {
    if (!habit) return;
    setPendingStart(false);
    const modeParam = `&clockType=${clockType}${clockType === "timer" ? `&duration=${durationSeconds}` : ""}`;
    router.push(`/goals/none/session/new?activity=${habit.activity_uid}${modeParam}`);
  };

  // Optimistic: flips is_frozen in the cache immediately (so the 4s color
  // fade and sound start on click), rolls back if the request fails.
  const handleToggleFreeze = async () => {
    if (!habit || isFreezing) return;
    const queryKey = ["habits", "byActivityUid", uid];
    const wasFrozen = habit.is_frozen;
    const previous = habit;

    if (wasFrozen) playCrack();
    else playHiss();

    queryClient.setQueryData<Habit>(queryKey, { ...habit, is_frozen: !wasFrozen });
    setIsFreezing(true);
    try {
      const res = await authedFetch(`/api/habits/${habit.id}/freeze`, {
        method: wasFrozen ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to update freeze state");
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success(wasFrozen ? "Habit unfrozen." : "Habit frozen.");
    } catch {
      queryClient.setQueryData(queryKey, previous);
      toast.error("Failed to update freeze state. Please try again.");
    } finally {
      setIsFreezing(false);
    }
  };

  if (habitError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center flex-col gap-4"
        style={{ backgroundColor: "var(--background)" }}
      >
        <p className="text-red-500">Habit not found.</p>
        <Link href="/habits" className="text-blue-500 hover:underline">
          Go Back
        </Link>
      </div>
    );
  }

  if (showSkeleton || !habit) {
    return <HabitDetailSkeleton />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <div
        className="bg-white dark:bg-dark-2 sticky top-3 z-10 mx-3 md:mx-6 mb-4 rounded-2xl border shadow-sm"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/habits" className="p-2 -ml-2 cursor-pointer rounded-lg transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <h1 className="text-xl font-bold ml-2 text-foreground dark:text-[var(--foreground)] truncate">
            {habit.display_name}
          </h1>
          <div className="flex-1" />

          <div ref={moreMenuRef} className="relative">
            <button
              className="p-2 cursor-pointer rounded-lg transition-colors"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="18" r="1.5" fill="currentColor" />
              </svg>
            </button>

            {isMoreMenuOpen && (
              <div
                className="absolute right-0 top-12 w-44 bg-white dark:bg-dark-2 border rounded-sm shadow-lg overflow-hidden z-50"
                style={{ borderColor: "var(--border)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="w-full cursor-pointer text-left font-medium py-3 px-4 text-sm hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsEditOpen(true);
                  }}
                >
                  Edit Habit
                </button>
                <button
                  type="button"
                  className="w-full cursor-pointer text-left font-medium py-3 px-4 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    handleDeleteHabit();
                  }}
                >
                  Delete Habit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout - Single Scroll */}
      <div className="block lg:hidden px-4 py-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {!isFrozen && (
            <button
              className="col-span-3 sm:col-span-1 py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:opacity-80 cursor-pointer"
              style={{ backgroundColor: aspectColor }}
              onClick={() => setPendingStart(true)}
            >
              Start {habit.activity_name}
            </button>
          )}
          <button
            className={`${freezeButtonClass()} ${isFrozen ? "col-span-2" : ""}`}
            onClick={handleToggleFreeze}
            disabled={isFreezing}
          >
            <FreezeButtonFill frozen={isFrozen} />
            <span className={`relative flex items-center gap-2 ${isFrozen ? "" : "opacity-80"}`}>
              <FaSnowflake className="w-4 h-4" />
              {habit.is_frozen ? "Unfreeze Habit" : "Freeze Habit"}
            </span>
          </button>
          <button
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-md bg-gray-700 dark:bg-dark-3 font-medium text-white text-base transition-all active:opacity-80 cursor-pointer"
            onClick={handleDeleteHabit}
          >
            <span className="flex items-center gap-2 opacity-80">
              <LinkIcon className="w-4 h-4" />
              Unlink Habit
            </span>
          </button>
        </div>

        <ContributionGraph dailyStats={habit.daily_stats} aspectColor={realAspectColor!} />

        <div className="space-y-4">
          <div className="flex gap-4 items-stretch">
            <div className="flex-1 min-w-0">
              <SignalCard habit={habit} aspectColor={aspectColor!} />
            </div>
            <div className="flex-2 min-w-0">
              <NextDateCard habit={habit} aspectColor={aspectColor!} />
            </div>
          </div>
          <HabitStatsCard habit={habit} formatDate={formatDate} />
        </div>
      </div>

      {/* Desktop Layout - Two Column */}
      <div className="hidden lg:flex gap-6 px-6 py-6">
        {/* Left Column */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-3 gap-3 mb-8">
            {!isFrozen && (
              <button
                className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:opacity-80 cursor-pointer"
                style={{ backgroundColor: aspectColor }}
                onClick={() => setPendingStart(true)}
              >
                Start {habit.activity_name}
              </button>
            )}
            <button
              className={`${freezeButtonClass()} ${isFrozen ? "col-span-2" : ""}`}
              onClick={handleToggleFreeze}
              disabled={isFreezing}
            >
              <FreezeButtonFill frozen={isFrozen} />
              <span className={`relative flex items-center gap-2 ${isFrozen ? "" : "opacity-80"}`}>
                <FaSnowflake className="w-4 h-4" />
                {habit.is_frozen ? "Unfreeze Habit" : "Freeze Habit"}
              </span>
            </button>
            <button
              className="flex items-center justify-center gap-2 py-3 rounded-2xl text-md bg-gray-700 dark:bg-dark-3 font-medium text-white text-base transition-all active:opacity-80 cursor-pointer"
              onClick={handleDeleteHabit}
            >
              <span className="flex items-center gap-2 opacity-80">
                <LinkIcon className="w-4 h-4" />
                Unlink Habit
              </span>
            </button>
          </div>

          <ContributionGraph dailyStats={habit.daily_stats} aspectColor={realAspectColor!} />
        </div>

        {/* Right Sidebar - Desktop Only */}
        <div style={{ width: "450px" }} className="flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="flex gap-4 items-stretch">
              <div className="flex-1 min-w-0">
                <SignalCard habit={habit} aspectColor={aspectColor!} />
              </div>
              <div className="flex-2 min-w-0">
                <NextDateCard habit={habit} aspectColor={aspectColor!} />
              </div>
            </div>
            <HabitStatsCard habit={habit} formatDate={formatDate} />
          </div>
        </div>
      </div>

      {pendingStart && (
        <PickTimerModePopup
          isOpen
          activityUid={habit.activity_uid}
          activityName={habit.activity_name}
          onBack={() => setPendingStart(false)}
          onClose={() => setPendingStart(false)}
          onStart={handleStartWithMode}
        />
      )}

      <EditHabitModal
        isOpen={isEditOpen}
        habitId={habit.id}
        initialName={habit.custom_name ?? ""}
        activityName={habit.activity_name}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveHabitName}
        onDelete={handleDeleteHabit}
        isSaving={isSaving}
        isDeleting={isDeleting}
        accentColor={aspectColor!}
      />
    </div>
  );
}

// GitHub-contribution-graph-style grid: one column per week, trailing 365
// days, each cell filled with the activity's aspect color at an opacity
// scaled linearly by that day's XP (capped at DAILY_XP_FOR_FULL_OPACITY).
// Days with no XP render as a plain empty cell, same as GitHub's graph.
type DayStat = { date: Date; xp: number; seconds: number };

// "YYYY-MM-DD" from local date parts -- matches daily_stats' keys (summed
// per the player's own local calendar day on the backend).
function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTimeSpent(seconds: number): string {
  if (seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Mon/Wed/Fri only, at their row index within a Sunday-start week (row 0 is
// Sunday) -- row 1 = Monday, row 3 = Wednesday, row 5 = Friday.
const Y_AXIS_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MAX_WINDOW_DAYS = 250;
const MIN_WEEKS_SHOWN = 6;
const COLUMN_WIDTH_PX = 24; // 20px cell + 4px gap, matches the w-5 cells and gap-1 below
const Y_AXIS_COLUMN_WIDTH_PX = 44; // w-10 label column + mr-1
const CARD_PADDING_PX = 32; // p-4 on both sides

function ContributionGraph({
  dailyStats,
  aspectColor,
}: {
  dailyStats: Record<string, { xp: number; seconds: number }> | undefined;
  aspectColor: string;
}) {
  const statsByDate = dailyStats ?? {};

  // Fit as many weeks as the card's actual width allows (capped at
  // MAX_WINDOW_DAYS/7 weeks) instead of always rendering a fixed 250-day
  // history and relying on horizontal scroll -- the graph should shrink to
  // its container, not overflow it.
  const containerRef = useRef<HTMLDivElement>(null);
  const [weeksToShow, setWeeksToShow] = useState(Math.ceil(MAX_WINDOW_DAYS / 7));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const recalculate = () => {
      const available = el.clientWidth - CARD_PADDING_PX - Y_AXIS_COLUMN_WIDTH_PX;
      const fitWeeks = Math.floor(available / COLUMN_WIDTH_PX);
      const maxWeeks = Math.ceil(MAX_WINDOW_DAYS / 7);
      setWeeksToShow(Math.max(MIN_WEEKS_SHOWN, Math.min(fitWeeks, maxWeeks)));
    };

    recalculate();
    const observer = new ResizeObserver(recalculate);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const WINDOW_DAYS = weeksToShow * 7;

  // Build day-by-day from (WINDOW_DAYS - 1) days ago through today, then
  // chunk into Sunday-start weeks so the grid reads left-to-right as
  // oldest-to-newest, same orientation as GitHub's own graph.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: DayStat[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // Build the key from local date parts, not toISOString() -- that
    // converts to UTC first, which shifts the date (and therefore misses
    // every lookup into daily_stats, keyed by the player's own local date)
    // for any positive UTC offset.
    const key = toLocalDateKey(date);
    const entry = statsByDate[key];
    days.push({ date, xp: entry?.xp ?? 0, seconds: entry?.seconds ?? 0 });
  }

  // Pad the front so the first column starts on a Sunday, matching
  // GitHub's grid alignment.
  const leadingBlanks = days[0].date.getDay();
  const padded: (DayStat | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...days,
  ];

  const weeks: (DayStat | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  // One month label per week column: shown only on the week where that
  // month's first visible day falls, so each month name prints once.
  const monthLabelForWeek: (string | null)[] = weeks.map((week, weekIndex) => {
    const firstDay = week.find((d) => d !== null);
    if (!firstDay) return null;
    if (firstDay.date.getDate() > 7) return null;
    const prevWeek = weeks[weekIndex - 1];
    const prevFirstDay = prevWeek?.find((d) => d !== null);
    if (prevFirstDay && prevFirstDay.date.getMonth() === firstDay.date.getMonth()) {
      return null;
    }
    return MONTH_LABELS[firstDay.date.getMonth()];
  });

  const opacityForXp = (xp: number) => {
    if (xp <= 0) return 0;
    return Math.min(xp / DAILY_XP_FOR_FULL_OPACITY, 1);
  };

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--muted)" }}>
        Activity
      </h3>
      <div
        ref={containerRef}
        className="rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-gray-50 dark:bg-dark-1 p-4"
      >
        <div className="flex gap-1">
          {/* Y-axis day labels */}
          <div className="flex flex-col gap-1 mr-1 pt-5">
            {Array.from({ length: 7 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="h-5 w-10 flex items-center text-[10px] font-medium text-gray-400 dark:text-[var(--muted)] whitespace-nowrap"
              >
                {Y_AXIS_LABELS[rowIndex] ?? ""}
              </div>
            ))}
          </div>

          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              <div className="h-4 text-[10px] font-medium text-gray-400 dark:text-[var(--muted)] whitespace-nowrap">
                {monthLabelForWeek[weekIndex] ?? ""}
              </div>
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={dayIndex} className="w-5 h-5" />;
                }
                const opacity = opacityForXp(day.xp);
                return (
                  <div
                    key={dayIndex}
                    title={`${day.date.toLocaleDateString()} — ${day.xp} XP — ${formatTimeSpent(day.seconds)}`}
                    className="w-5 h-5 rounded-sm border border-gray-200 dark:border-[var(--border)] cursor-pointer transition-transform hover:scale-110"
                    style={
                      opacity > 0
                        ? { backgroundColor: aspectColor, opacity, borderColor: aspectColor }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Strength-signal card — just the 3-bar meter, standalone. Sits beside
// NextDateCard at a 1:2 width ratio.
function SignalCard({ habit, aspectColor }: { habit: Habit; aspectColor: string }) {
  return (
    <div className="h-full rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-6 flex flex-col">
     
      <div className="flex-1 flex items-center justify-center">
        <HabitStrengthBars
          tier={habit.strength_tier}
          accentColor={aspectColor}
          frozen={habit.is_frozen}
        />
      </div>
    </div>
  );
}

const SHORT_MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// If there isn't enough history for a real prediction yet
// (next_predicted_occurrence is null), fall back to "today" -- or
// "tomorrow" if today's already done -- rather than showing no date at all.
function resolveNextDate(habit: Habit): { date: Date; isFallback: boolean } {
  if (habit.next_predicted_occurrence) {
    // Date-only string ("YYYY-MM-DD") -- parse as local, not UTC-midnight,
    // so it doesn't shift a day back in negative-UTC-offset timezones.
    const [y, m, d] = habit.next_predicted_occurrence.split("-").map(Number);
    return { date: new Date(y, m - 1, d), isFallback: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { today: todayIndex, progress } = habit.week_progress ?? { today: -1, progress: [] };
  const doneToday = todayIndex >= 0 && progress[todayIndex];

  if (doneToday) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { date: tomorrow, isFallback: true };
  }
  return { date: today, isFallback: true };
}

// Calendar-tile card: a real-desk-calendar-style tile (gray month header
// strip, big colored day number beneath, bordered) labeled "Next". Falls
// back to today/tomorrow (see resolveNextDate) when there's not enough
// history for a real prediction, with a small caption explaining the
// fallback instead of leaving the card looking broken.
function NextDateCard({ habit, aspectColor }: { habit: Habit; aspectColor: string }) {
  const { date, isFallback } = resolveNextDate(habit);
  // Only animate the tile's colors for swaps after the page has loaded, not
  // on first render.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Frozen habits have no upcoming day -- same calendar tile, but "Frozen"
  // in the month strip and a cyan snowflake where the date would be.
  if (habit.is_frozen) {
    return (
      <div className="h-full rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-6 flex flex-col">
        <div className="flex-1 flex items-center gap-5">
          <div className="shrink-0 w-20 rounded-xl border border-gray-200 dark:border-[var(--border)] overflow-hidden">
            <div className="bg-gray-100 dark:bg-dark-3 text-center">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-[var(--muted)]">
                Frozen
              </span>
            </div>
            <div className="py-3 flex items-center justify-center">
              <FadeInColor color={aspectColor} animate={ready}>
                <FaSnowflake className="w-8 h-8" />
              </FadeInColor>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground dark:text-[var(--foreground)]">
              Habit frozen
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Unfreeze this habit to see its next suggested day.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-6 flex flex-col">
   
      <div className="flex-1 flex items-center gap-5">
        <div className="shrink-0 w-20 rounded-xl border border-gray-200 dark:border-[var(--border)] overflow-hidden">
          <div className="bg-gray-100 dark:bg-dark-3 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-[var(--muted)]">
              {SHORT_MONTH_LABELS[date.getMonth()]}
            </span>
          </div>
          <div className="py-3 text-center">
            <FadeInColor color={aspectColor} animate={ready} className="text-3xl font-extrabold leading-none">
              {date.getDate()}
            </FadeInColor>
          </div>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground dark:text-[var(--foreground)]">
            {date.toLocaleDateString(undefined, { weekday: "long" })}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Next Suggested Day
          </p>
          {isFallback && (
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Not enough history yet to predict
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Last done / Tracking since, each a row with a hairline divider -- mirrors
// GoalDetailClient's right-sidebar stats block style.
function HabitStatsCard({
  habit,
  formatDate,
}: {
  habit: Habit;
  formatDate: (d: string) => string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          Last done
        </span>
        <span className="text-lg font-bold text-foreground dark:text-[var(--foreground)]">
          {habit.last_session_at ? formatDate(habit.last_session_at) : "Not done yet"}
        </span>
      </div>

      <div className="h-px" style={{ backgroundColor: "var(--border)" }} />

      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          Tracking since
        </span>
        <span className="text-lg font-bold text-foreground dark:text-[var(--foreground)]">
          {formatDate(habit.created_at)}
        </span>
      </div>
    </div>
  );
}

// Mirrors app/(main)/habits/page.tsx's HabitStrengthBars.
function HabitStrengthBars({
  tier,
  accentColor,
  frozen = false,
}: {
  tier: StrengthTier;
  accentColor: string;
  frozen?: boolean;
}) {
  const filled = STRENGTH_TIER_BARS[tier];
  const bars = [
    { height: 16, y: 39 },
    { height: 30, y: 25 },
    { height: 45, y: 10 },
  ];

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <svg
        width={64}
        height={62}
        viewBox="0 0 48 62"
        role="img"
        aria-label={`Habit strength: ${tier}`}
      >
        {bars.map((bar, index) => (
          <rect
            key={index}
            x={3 + index * 16}
            y={bar.y}
            width="10"
            height={bar.height}
            rx="2.5"
            strokeWidth={index < filled ? 0 : 1.5}
            // Everything goes through style (not attributes/classes) so the
            // aspect-color <-> cyan swap transitions smoothly.
            style={{
              fill: accentColor,
              fillOpacity: index < filled ? 1 : frozen ? 0.2 : 0,
              stroke: index < filled || frozen ? accentColor : "#6b7280",
              strokeOpacity: index < filled ? 1 : frozen ? 0.4 : 0.5,
              transition: `fill ${FREEZE_FADE_MS}ms, fill-opacity ${FREEZE_FADE_MS}ms, stroke ${FREEZE_FADE_MS}ms, stroke-opacity ${FREEZE_FADE_MS}ms`,
            }}
          />
        ))}
      </svg>
      <span className="text-[11px] text-gray-500">
        {STRENGTH_TIER_LABEL[tier]}
      </span>
    </div>
  );
}

function HabitDetailSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <div
        className="bg-white dark:bg-dark-2 sticky top-3 z-10 mx-3 md:mx-6 mb-4 rounded-2xl border shadow-sm px-6 py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-dark-3 animate-pulse" />
            <div className="h-6 w-48 rounded bg-gray-200 dark:bg-dark-3 animate-pulse" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-dark-3 animate-pulse" />
        </div>
      </div>

      <div className="px-6 py-6 animate-pulse">
        <div className="h-12 w-48 rounded-2xl bg-gray-200 dark:bg-dark-3 mb-8" />
        <div className="rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-4 flex items-center gap-6">
          <div className="h-16 w-16 rounded bg-gray-200 dark:bg-dark-3 shrink-0" />
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-8 w-8 rounded-md bg-gray-200 dark:bg-dark-3" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
