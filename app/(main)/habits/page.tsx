"use client";

import { useMasteryAccent } from "@/src/lib/hooks/useMasteryAccent";
import { useAuth } from "@/src/context/AuthContext";
import { useToast, useConfirm } from "@/src/context/ToastContext";
import { playCrack, playHiss } from "@/src/lib/utils/habitSounds";
import TodayTimeControl from "@/src/components/habits/TodayTimeControl";
import {
  DEFAULT_TODAY_TIME,
  defaultTimeForIndex,
  timeToMinutes,
  to12Hour,
} from "@/src/lib/utils/habitTime";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { setGoalsNavPreference } from "@/src/lib/hooks/useGoalsNavPreference";
import {
  SquaresPlusIcon,
  ArrowPathRoundedSquareIcon,
  PlusIcon,
  PencilSquareIcon,
  PlayIcon,
  CheckIcon,
  BeakerIcon,
  FolderPlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon as PlusOutlineIcon,
} from "@heroicons/react/24/outline";
import { Droplet, Leaf } from "lucide-react";
import { FaSnowflake } from "react-icons/fa";
import { ACTIVITY_META, ActivityType } from "@/src/lib/types/activityMeta";
import type { ClockType } from "@/src/components/goals/PickTimerModePopup";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

const NewActivityModal = dynamic(
  () => import("@/src/components/goals/NewActivityModel"),
);
const PickTimerModePopup = dynamic(
  () => import("@/src/components/goals/PickTimerModePopup"),
);
const GoalPickerPopup = dynamic(
  () => import("@/src/components/goals/GoalPickerPopup"),
);
const StrengthInfoPopup = dynamic(
  () => import("@/src/components/habits/StrengthInfoPopup"),
);
const EditHabitModal = dynamic(
  () => import("@/src/components/goals/EditHabitModal"),
);

interface Activity {
  id: string;
  uid?: string;
  pk?: number;
  name: string;
  type?: ActivityType;
  total_xp?: number;
  xp_distribution?: Record<string, number>;
}

type StrengthTier = "dormant" | "light" | "steady" | "strong";

type WeekProgress = {
  today: number;
  progress: boolean[];
};

type StrengthOutlook = {
  streak_weeks: number;
  days_this_week: number;
  week_ends_on: string;
  at_risk: boolean;
  drops_to: StrengthTier | null;
  days_to_hold: number | null;
  next_tier: StrengthTier | null;
  days_to_upgrade: number | null;
};

type Habit = {
  id: number;
  activity_uid: string;
  activity_name: string;
  activity_type: ActivityType;
  activity_emoji: string;
  category_id: number | null;
  category_name: string | null;
  today: boolean;
  today_time: string | null;
  custom_name: string | null;
  display_name: string;
  is_active: boolean;
  is_frozen: boolean;
  created_at: string;
  last_session_at: string | null;
  strength_score: number;
  strength_tier: StrengthTier;
  strength_outlook: StrengthOutlook | null;
  qualifying_days: number[];
  weeks_observed: number;
  next_predicted_occurrence: string | null;
  week_progress: WeekProgress;
};

type HabitCategory = {
  id: number;
  name: string;
  is_default: boolean;
  created_at: string;
  habits: Habit[];
};

// Frozen habits are drawn entirely in cyan (strength bars, day bars, chevron).
const FROZEN_COLOR = "#06b6d4";
const FROZEN_BG = "rgba(6, 182, 212, 0.07)";

// Lets any strength meter open the strength info popup without threading a
// callback through every card component.
const StrengthInfoContext = createContext<(habit: Habit) => void>(() => {});

// How long a card's background takes to fade when a habit is frozen/unfrozen.
const FREEZE_FADE_MS = 4000;

// false on the first paint when `active`, then flips to true one frame
// later -- lets a freshly-mounted card start from its previous look and
// CSS-transition to its new one.
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

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const STRENGTH_TIER_LABEL: Record<StrengthTier, string> = {
  dormant: "Dormant",
  light: "Weak",
  steady: "Steady",
  strong: "Strong",
};

// How many of the 3 bars are filled at each tier — ascending-height signal
// meter per the habit strength design spec. No numbers/percentage anywhere;
// the bar count alone is the entire interface.
const STRENGTH_TIER_BARS: Record<StrengthTier, number> = {
  dormant: 0,
  light: 1,
  steady: 2,
  strong: 3,
};

// Matches the backend's MAX_HABIT_CATEGORIES_PER_PLAYER (api.v1.habit_views)
// -- including the default "Entertainment" category.
const MAX_HABIT_CATEGORIES = 3;

// Drop container ids. "today"/"unplanned" = the main-area sections (Done is
// deliberately not a container: nothing is dropped into or dragged out of
// it), "frozen" = the Frozen Habits card, "category-<id>" = a specific
// HabitCategoryCard.
const TODAY_CONTAINER_ID = "today";
const UNPLANNED_CONTAINER_ID = "unplanned";
const FROZEN_CONTAINER_ID = "frozen";
const categoryContainerId = (categoryId: number) => `category-${categoryId}`;

// Plain-language read of what this week still decides for a habit's
// strength. `risk` = will drop at the Saturday rollover unless the player
// shows up; `upgrade` = showing up again this week levels it up.
function strengthStatus(
  habit: Habit,
): { kind: "risk" | "upgrade"; text: string } | null {
  const o = habit.strength_outlook;
  if (!o || habit.is_frozen) return null;
  const days = (n: number) => `${n} more day${n === 1 ? "" : "s"}`;
  if (o.at_risk && o.drops_to) {
    // Only warn on the last two days of the week (the week ends on Saturday);
    // earlier than that there's still plenty of time, so stay quiet.
    const [y, m, d] = o.week_ends_on.split("-").map(Number);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86400000);
    if (daysLeft > 1) return null;
    return {
      kind: "risk",
      text: `You might drop to ${STRENGTH_TIER_LABEL[o.drops_to]} when the week ends.`,
    };
  }
  if (o.next_tier && o.days_to_upgrade !== null) {
    return {
      kind: "upgrade",
      text: `${days(o.days_to_upgrade)} this week → ${STRENGTH_TIER_LABEL[o.next_tier]}`,
    };
  }
  return null;
}

// Icon shown next to a habit's name for what this week still decides:
// a yellow warning triangle when it will drop a tier at the weekly rollover,
// a green leaf when one more day would level it up. Hovering reveals the
// message in a bubble.
function StrengthBadge({ habit, small = false }: { habit: Habit; small?: boolean }) {
  const status = strengthStatus(habit);
  if (!status) return null;
  const iconClass = small ? "w-4 h-4" : "w-5 h-5";
  return (
    <span className="group relative shrink-0 inline-flex items-center cursor-pointer" aria-label={status.text}>
      {status.kind === "risk" ? (
        <ExclamationTriangleIcon className={`${iconClass} text-amber-500`} />
      ) : (
        <Leaf className={`${small ? "w-3 h-3" : "w-4 h-4"} text-emerald-500`} fill="currentColor" />
      )}
      <span className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden w-max max-w-[220px] rounded-lg border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-1 px-2.5 py-1.5 text-xs font-medium text-black dark:text-[var(--foreground)] shadow-lg group-hover:block">
        {status.text}
      </span>
    </span>
  );
}

function strengthTooltip(habit: Habit): string {
  const status = strengthStatus(habit);
  const label = STRENGTH_TIER_LABEL[habit.strength_tier];
  return status ? `${label} — ${status.text}` : label;
}

// A session was completed on this habit today (player-local day).
function isDoneToday(habit: Habit): boolean {
  const { today = -1, progress = [] } = habit.week_progress ?? {};
  return today >= 0 && !!progress[today];
}

type HabitChanges = {
  category_id?: number | null;
  today?: boolean;
  today_time?: string;
  frozen?: boolean;
};
type TodayDropPreview = { index: number; height: number; time: string };
const SORT_SETTLE_MS = 1000;
type SectionKey = "today" | "done" | "unplanned";

export default function HabitsPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { me, loading: authLoading } = useAuth();
  const username = me?.username;
  const accent = useMasteryAccent();
  const isMastery = !!me?.masteryTitle && me.masteryTitle !== "Rookie";
  const tabAccentColor = isMastery ? accent.primary : "var(--rookie-primary)";

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<Activity | null>(null);
  // Playing a habit asks which goal to log the session under (or none), then
  // goes on to the timer-mode popup. `pendingGoalRef` is the goal uid, or
  // "none" for a free session.
  const [goalPickHabit, setGoalPickHabit] = useState<Habit | null>(null);
  const [pendingGoalRef, setPendingGoalRef] = useState("none");
  const [timerBackTo, setTimerBackTo] = useState<"activity-picker" | "goal-picker">(
    "activity-picker",
  );
  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState(false);
  const [addingToCategoryId, setAddingToCategoryId] = useState<number | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isSavingHabitName, setIsSavingHabitName] = useState(false);
  const [isDeletingHabit, setIsDeletingHabit] = useState(false);
  const [freezingHabitId, setFreezingHabitId] = useState<number | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [draggingHabit, setDraggingHabit] = useState<Habit | null>(null);
  // Live "you'd drop it here" gap inside the Today list while dragging over it.
  const [todayDropPreview, setTodayDropPreview] = useState<TodayDropPreview | null>(null);
  const todayDropPreviewRef = useRef<TodayDropPreview | null>(null);
  // While a habit's time is being stepped (arrows/scroll), the Today list
  // keeps sorting by its time from before the stepping started, and only
  // re-sorts SORT_SETTLE_MS after the last step.
  const [sortHoldTimes, setSortHoldTimes] = useState<Record<number, string>>({});
  const sortHoldTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [strengthInfoHabit, setStrengthInfoHabit] = useState<Habit | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<SectionKey, boolean>>({
    today: false,
    done: false,
    unplanned: false,
  });
  // habit id -> was it frozen *before* the latest freeze toggle; present
  // only for FREEZE_FADE_MS so the re-mounted card can fade its background.
  const [fadeFrom, setFadeFrom] = useState<Record<number, boolean>>({});
  const fadeTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const markFreezeFade = (habitId: number, wasFrozen: boolean) => {
    // Freezing hisses; thawing a frozen habit cracks.
    if (wasFrozen) playCrack();
    else playHiss();
    setFadeFrom((prev) => ({ ...prev, [habitId]: wasFrozen }));
    clearTimeout(fadeTimers.current[habitId]);
    fadeTimers.current[habitId] = setTimeout(() => {
      setFadeFrom((prev) => {
        const next = { ...prev };
        delete next[habitId];
        return next;
      });
    }, FREEZE_FADE_MS + 500);
  };

  // Small drag-activation distance so a plain click (Start/Edit/Play
  // buttons, the category name input) still registers as a click instead
  // of being swallowed by drag-start.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    setGoalsNavPreference("habits");
  }, []);

  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const res = await authedFetch(`/api/habits`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch habits");
      const data = await res.json();
      return (Array.isArray(data.results) ? data.results : []) as Habit[];
    },
    enabled: !authLoading && !!username,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["habits", "categories"],
    queryFn: async () => {
      const res = await authedFetch(`/api/habits/categories`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch habit categories");
      const data = await res.json();
      return (Array.isArray(data) ? data : []) as HabitCategory[];
    },
    enabled: !authLoading && !!username,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const showHabitsSkeleton = habitsLoading && habits.length === 0;
  // /api/habits only returns uncategorized habits; categorized ones come
  // nested under their category. Merge both so frozen habits show up in the
  // Frozen card regardless of which category they belong to.
  const allHabits = [
    ...habits,
    ...categories.flatMap((c) => c.habits).filter((ch) => !habits.some((h) => h.id === ch.id)),
  ];
  const frozenHabits = allHabits.filter((h) => h.is_frozen);

  // Soonest next_predicted_occurrence first; habits with no prediction yet
  // (not enough history -- see main.habits.MIN_WEEKS_FOR_PREDICTION) sort
  // to the end rather than being treated as "furthest away".
  const byNextOccurrence = (a: Habit, b: Habit) => {
    if (!a.next_predicted_occurrence && !b.next_predicted_occurrence) return 0;
    if (!a.next_predicted_occurrence) return 1;
    if (!b.next_predicted_occurrence) return -1;
    return a.next_predicted_occurrence.localeCompare(b.next_predicted_occurrence);
  };

  // Main-area sections. Frozen habits only ever live in the Frozen card.
  // - Today: scheduled for today and not done yet (categorized ones too, a
  //   habit's category copy stays in its category card).
  // - Done: uncategorized habits done today. A categorized habit that's done
  //   is shown dimmed inside its own category instead.
  // - Unplanned: uncategorized, not scheduled, not done.
  // So a habit only ever appears twice when it's categorized AND scheduled.
  const activeHabits = allHabits.filter((h) => !h.is_frozen);
  // The Today list is ordered by its scheduled time, always.
  const todayHabits = activeHabits
    .filter((h) => h.today && !isDoneToday(h))
    .sort(
      (a, b) =>
        timeToMinutes(sortHoldTimes[a.id] ?? a.today_time) -
          timeToMinutes(sortHoldTimes[b.id] ?? b.today_time) || a.id - b.id,
    );
  const doneHabits = activeHabits
    .filter((h) => !h.category_id && isDoneToday(h))
    .sort(byNextOccurrence);
  const unplannedHabits = activeHabits
    .filter((h) => !h.category_id && !h.today && !isDoneToday(h))
    .sort(byNextOccurrence);

  // Animate Today cards sliding to their new slot when the order changes
  // (FLIP: remember each card's top, then after the re-order start it at the
  // old spot and transition to the new one). Skipped around drags, where the
  // layout shifts for the drop gap instead.
  const todayOrderKey = todayHabits.map((h) => h.id).join(",");
  const todayTops = useRef<Map<string, number>>(new Map());
  const lastTodayOrderKey = useRef("");
  const wasDragging = useRef(false);
  useLayoutEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-today-item]"));
    const tops = new Map<string, number>();
    for (const el of els) {
      const parentTop = el.parentElement?.getBoundingClientRect().top ?? 0;
      tops.set(el.dataset.todayItem!, el.getBoundingClientRect().top - parentTop);
    }
    const dragging = !!draggingHabit || !!todayDropPreview;
    if (todayOrderKey !== lastTodayOrderKey.current && !dragging && !wasDragging.current) {
      for (const el of els) {
        const id = el.dataset.todayItem!;
        const before = todayTops.current.get(id);
        const after = tops.get(id)!;
        if (before === undefined || Math.abs(before - after) < 1) continue;
        el.style.transition = "none";
        el.style.transform = `translateY(${before - after}px)`;
        el.getBoundingClientRect(); // commit the starting position
        el.style.transition = "transform 350ms ease";
        el.style.transform = "";
      }
    }
    todayTops.current = tops;
    lastTodayOrderKey.current = todayOrderKey;
    wasDragging.current = dragging;
  });

  const toggleSection = (key: SectionKey) =>
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleOpenEmptySessionModal = () => {
    setIsActivityModalOpen(true);
  };

  const handleOpenNewHabit = (categoryId: number | null = null) => {
    setAddingToCategoryId(categoryId);
    setIsNewHabitModalOpen(true);
  };

  const handlePickHabitCandidate = async (candidate: Activity) => {
    const uid = candidate.uid ?? candidate.id;
    try {
      const res = await authedFetch(`/api/activities/${uid}/habit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          addingToCategoryId ? { category_id: addingToCategoryId } : {},
        ),
      });
      if (!res.ok) throw new Error("Failed to create habit");
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits", "categories"] });
      setIsNewHabitModalOpen(false);
      setAddingToCategoryId(null);
      toast.success(`${candidate.name} is now a habit.`);
    } catch {
      toast.error("Failed to create habit. Please try again.");
    }
  };

  const handleSaveHabitName = async (habitId: number, customName: string) => {
    setIsSavingHabitName(true);
    try {
      const res = await authedFetch(`/api/habits/${habitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_name: customName || null }),
      });
      if (!res.ok) throw new Error("Failed to update habit");
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setEditingHabit(null);
      toast.success("Habit updated.");
    } catch {
      toast.error("Failed to update habit. Please try again.");
    } finally {
      setIsSavingHabitName(false);
    }
  };

  const handleDeleteHabit = async () => {
    if (!editingHabit) return;
    const ok = await confirm({
      title: "Delete habit",
      message: `Are you sure you want to stop tracking "${editingHabit.display_name}"? This cannot be undone.`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;

    setIsDeletingHabit(true);
    try {
      const res = await authedFetch(`/api/activities/${editingHabit.activity_uid}/habit`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete habit");
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits", "categories"] });
      setEditingHabit(null);
      toast.success("Habit deleted.");
    } catch {
      toast.error("Failed to delete habit. Please try again.");
    } finally {
      setIsDeletingHabit(false);
    }
  };

  // Optimistic: flips is_frozen in both caches right away (the habit moves
  // between the Frozen card and its home list instantly), rolls back if the
  // request fails, and re-syncs with the server once it settles.
  const handleToggleFreeze = async (habit: Habit) => {
    if (freezingHabitId === habit.id) return;
    const nextFrozen = !habit.is_frozen;
    const prevHabits = habits;
    const prevCategories = categories;
    markFreezeFade(habit.id, habit.is_frozen);
    const flip = (h: Habit): Habit => (h.id === habit.id ? { ...h, is_frozen: nextFrozen } : h);

    queryClient.setQueryData<Habit[]>(["habits"], (prev = []) => prev.map(flip));
    queryClient.setQueryData<HabitCategory[]>(["habits", "categories"], (prev = []) =>
      prev.map((c) => ({ ...c, habits: c.habits.map(flip) })),
    );

    setFreezingHabitId(habit.id);
    try {
      const res = await authedFetch(`/api/habits/${habit.id}/freeze`, {
        method: habit.is_frozen ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to update freeze state");
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits", "categories"] });
    } catch {
      queryClient.setQueryData(["habits"], prevHabits);
      queryClient.setQueryData(["habits", "categories"], prevCategories);
      toast.error("Failed to update freeze state. Please try again.");
    } finally {
      setFreezingHabitId(null);
    }
  };

  const handleCreateCategory = async () => {
    if (categories.length >= MAX_HABIT_CATEGORIES || isCreatingCategory) return;
    setIsCreatingCategory(true);
    try {
      const res = await authedFetch(`/api/habits/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to create category");
      const created = (await res.json()) as HabitCategory;
      // Append directly to the cache instead of just invalidating, so the
      // new category shows up immediately below the existing ones without
      // waiting on a refetch round-trip.
      queryClient.setQueryData<HabitCategory[]>(["habits", "categories"], (prev = []) => [
        ...prev,
        created,
      ]);
    } catch {
      toast.error("Failed to create category. Please try again.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleRenameCategory = async (categoryId: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const res = await authedFetch(`/api/habits/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to rename category");
      queryClient.setQueryData<HabitCategory[]>(["habits", "categories"], (prev = []) =>
        prev.map((c) => (c.id === categoryId ? { ...c, name: trimmed } : c)),
      );
    } catch {
      toast.error("Failed to rename category. Please try again.");
    }
  };

  // Optimistically detaches the category's habits into the main list and
  // drops the category, so the habits reappear in the main section without
  // a reload; rolls back if the backend refuses.
  const handleDeleteCategory = async (category: HabitCategory) => {
    const prevHabits = habits;
    const prevCategories = categories;
    const moved = category.habits.map((h) => ({
      ...h,
      category_id: null,
      category_name: null,
    }));

    queryClient.setQueryData<Habit[]>(["habits"], (prev = []) => [
      ...prev,
      ...moved.filter((m) => !prev.some((h) => h.id === m.id)),
    ]);
    queryClient.setQueryData<HabitCategory[]>(["habits", "categories"], (prev = []) =>
      prev.filter((c) => c.id !== category.id),
    );

    try {
      const res = await authedFetch(`/api/habits/categories/${category.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits", "categories"] });
    } catch {
      queryClient.setQueryData(["habits"], prevHabits);
      queryClient.setQueryData(["habits", "categories"], prevCategories);
      toast.error("Failed to delete category. Please try again.");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const habit = event.active.data.current?.habit as Habit | undefined;
    if (habit) setDraggingHabit(habit);
  };

  const updateTodayDropPreview = (next: TodayDropPreview | null) => {
    todayDropPreviewRef.current = next;
    setTodayDropPreview((prev) =>
      prev === next ||
      (prev && next && prev.index === next.index && prev.height === next.height && prev.time === next.time)
        ? prev
        : next,
    );
  };

  // Where in the Today list the dragged card currently sits, by comparing
  // its center with the centers of the other Today cards. The placeholder is
  // not a card, so it can't feed back into this (no jitter at the gap).
  const handleDragMove = (event: DragMoveEvent) => {
    const dragged = event.active.data.current?.habit as Habit | undefined;
    if (!dragged || String(event.over?.id) !== TODAY_CONTAINER_ID) {
      if (todayDropPreviewRef.current) updateTodayDropPreview(null);
      return;
    }
    const habit = allHabits.find((h) => h.id === dragged.id) ?? dragged;
    if (isDoneToday(habit)) {
      if (todayDropPreviewRef.current) updateTodayDropPreview(null);
      return;
    }

    const others = todayHabits.filter((h) => h.id !== habit.id);
    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-today-item]"),
    ).filter((el) => el.dataset.todayItem !== String(habit.id));
    const draggedRect = event.active.rect.current.translated;
    let index = others.length; // collapsed list / no position info: bottom
    if (items.length === others.length && items.length > 0 && draggedRect) {
      const centerY = draggedRect.top + draggedRect.height / 2;
      index = items.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2 < centerY;
      }).length;
    }
    updateTodayDropPreview({
      index,
      height: items[0]?.offsetHeight || 104,
      time: defaultTimeForIndex(
        others.map((h) => h.today_time ?? DEFAULT_TODAY_TIME),
        index,
      ),
    });
  };

  const handleDragCancel = () => {
    updateTodayDropPreview(null);
    setDraggingHabit(null);
  };

  // Applies a habit's category/today/frozen change to both query caches
  // immediately (so the card visually lands in its new place with no
  // flicker), then fires whichever backend requests the change actually
  // requires, and rolls back if any fails.
  const applyHabitUpdate = async (habit: Habit, changes: HabitChanges) => {
    const nextCategoryId =
      changes.category_id !== undefined ? changes.category_id : habit.category_id;
    const nextToday = changes.today ?? habit.today;
    const nextFrozen = changes.frozen ?? habit.is_frozen;
    const nextTime = nextToday
      ? (changes.today_time ?? habit.today_time ?? DEFAULT_TODAY_TIME)
      : null;
    const categoryChanged = nextCategoryId !== habit.category_id;
    const todayChanged = nextToday !== habit.today;
    const timeChanged = nextTime !== habit.today_time;
    const frozenChanged = nextFrozen !== habit.is_frozen;
    if (!categoryChanged && !todayChanged && !timeChanged && !frozenChanged) return;

    const prevHabits = habits;
    const prevCategories = categories;
    if (frozenChanged) markFreezeFade(habit.id, habit.is_frozen);

    const updated: Habit = {
      ...habit,
      category_id: nextCategoryId,
      category_name: categories.find((c) => c.id === nextCategoryId)?.name ?? null,
      today: nextToday,
      today_time: nextTime,
      is_frozen: nextFrozen,
    };

    // /api/habits only holds uncategorized habits and each category holds
    // its own, so re-home the habit in whichever list it now belongs to.
    queryClient.setQueryData<Habit[]>(["habits"], (prev = []) => {
      const rest = prev.filter((h) => h.id !== habit.id);
      return nextCategoryId ? rest : [...rest, updated];
    });
    queryClient.setQueryData<HabitCategory[]>(["habits", "categories"], (prev = []) =>
      prev.map((c) => ({
        ...c,
        habits:
          c.id === nextCategoryId
            ? [...c.habits.filter((h) => h.id !== habit.id), updated]
            : c.habits.filter((h) => h.id !== habit.id),
      })),
    );

    try {
      if (categoryChanged || todayChanged || timeChanged) {
        const res = await authedFetch(`/api/habits/${habit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(categoryChanged && { category_id: nextCategoryId }),
            ...(todayChanged && { today: nextToday }),
            ...(nextToday && (todayChanged || timeChanged) && { today_time: nextTime }),
          }),
        });
        if (!res.ok) throw new Error("Failed to move habit");
      }
      if (frozenChanged) {
        const res = await authedFetch(`/api/habits/${habit.id}/freeze`, {
          method: nextFrozen ? "POST" : "DELETE",
        });
        if (!res.ok) throw new Error("Failed to update freeze state");
      }
      // Re-sync with the server after a real change -- the optimistic
      // write above is just for instant visual feedback; this is what
      // guarantees the UI can't drift from the backend's actual state.
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habits", "categories"] });
    } catch {
      queryClient.setQueryData(["habits"], prevHabits);
      queryClient.setQueryData(["habits", "categories"], prevCategories);
      toast.error("Failed to update habit. Please try again.");
    }
  };

  // The + buttons have no drop position, so they use the default 12:00 PM.
  const handleAddToToday = (habit: Habit) =>
    applyHabitUpdate(habit, { today: true, today_time: DEFAULT_TODAY_TIME });

  // Time edits (arrows, scroll wheel, typing) update the cache on every step
  // so the list re-sorts instantly, but only the final value is sent.
  const timeSaveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const releaseSortHold = (habitId: number) => {
    clearTimeout(sortHoldTimers.current[habitId]);
    setSortHoldTimes((prev) => {
      if (prev[habitId] === undefined) return prev;
      const next = { ...prev };
      delete next[habitId];
      return next;
    });
  };

  const handleTodayTimeChange = (
    habit: Habit,
    time: string,
    opts?: { immediate?: boolean },
  ) => {
    if (opts?.immediate) {
      releaseSortHold(habit.id);
    } else {
      setSortHoldTimes((prev) =>
        prev[habit.id] !== undefined
          ? prev
          : { ...prev, [habit.id]: habit.today_time ?? DEFAULT_TODAY_TIME },
      );
      clearTimeout(sortHoldTimers.current[habit.id]);
      sortHoldTimers.current[habit.id] = setTimeout(
        () => releaseSortHold(habit.id),
        SORT_SETTLE_MS,
      );
    }
    const patch = (h: Habit): Habit => (h.id === habit.id ? { ...h, today_time: time } : h);
    queryClient.setQueryData<Habit[]>(["habits"], (prev = []) => prev.map(patch));
    queryClient.setQueryData<HabitCategory[]>(["habits", "categories"], (prev = []) =>
      prev.map((c) => ({ ...c, habits: c.habits.map(patch) })),
    );
    clearTimeout(timeSaveTimers.current[habit.id]);
    timeSaveTimers.current[habit.id] = setTimeout(async () => {
      try {
        const res = await authedFetch(`/api/habits/${habit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ today_time: time }),
        });
        if (!res.ok) throw new Error("Failed to save time");
      } catch {
        queryClient.invalidateQueries({ queryKey: ["habits"] });
        queryClient.invalidateQueries({ queryKey: ["habits", "categories"] });
        toast.error("Failed to save the time. Please try again.");
      }
    }, 500);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const preview = todayDropPreviewRef.current;
    updateTodayDropPreview(null);
    setDraggingHabit(null);
    const { active, over } = event;
    if (!over) return;

    const draggedHabit = active.data.current?.habit as Habit | undefined;
    if (!draggedHabit) return;
    // Re-read from the live cache rather than trusting the habit captured
    // at drag-start -- it can be stale if another update landed mid-drag,
    // which would otherwise skip a PATCH that's actually still needed.
    const habit = allHabits.find((h) => h.id === draggedHabit.id) ?? draggedHabit;

    const target = String(over.id);
    const doneToday = isDoneToday(habit);
    let changes: HabitChanges;

    if (target === FROZEN_CONTAINER_ID) {
      // Frozen is a cross-cutting flag: category and schedule are untouched.
      changes = { frozen: true };
    } else if (target === TODAY_CONTAINER_ID) {
      // A done habit has nothing left to schedule for today.
      if (doneToday) return;
      // Category is kept on purpose: it shows in both its category and Today.
      // The time is the one the live placeholder was showing.
      changes = {
        frozen: false,
        today: true,
        today_time:
          preview?.time ??
          defaultTimeForIndex(
            todayHabits
              .filter((h) => h.id !== habit.id)
              .map((h) => h.today_time ?? DEFAULT_TODAY_TIME),
            todayHabits.filter((h) => h.id !== habit.id).length,
          ),
      };
    } else if (target === UNPLANNED_CONTAINER_ID) {
      // It would land in Done (nothing can be dropped there), so refuse.
      if (doneToday) return;
      changes = { frozen: false, category_id: null, today: false };
    } else if (target.startsWith("category-")) {
      changes = {
        frozen: false,
        category_id: Number(target.slice("category-".length)),
        today: false,
      };
    } else {
      return;
    }

    await applyHabitUpdate(habit, changes);
  };

  const buildRatesParam = (activity: Activity) => {
    const dist = activity.xp_distribution ?? {};
    const SECONDS_PER_HOUR = 3600;
    const aspects = ["physique", "energy", "logic", "creativity", "social"] as const;
    const totalXp = aspects.reduce((s, k) => s + (dist[k] ?? 0), 0);
    const rates = totalXp > 0
      ? aspects.reduce((acc, k) => {
          acc[k] = Math.round((dist[k] ?? 0) / SECONDS_PER_HOUR * 10000) / 10000;
          return acc;
        }, {} as Record<string, number>)
      : {};
    return Object.keys(rates).length > 0
      ? `&rates=${encodeURIComponent(JSON.stringify(rates))}`
      : "";
  };

  const handleSelectActivity = (activity: Activity) => {
    setIsActivityModalOpen(false);
    setPendingGoalRef("none");
    setTimerBackTo("activity-picker");
    setPendingActivity(activity);
  };

  // Habit cards already know their activity -- skip the activity picker and
  // ask for a goal (or a free session) first.
  const handleStartHabitSession = (habit: Habit) => {
    setGoalPickHabit(habit);
  };

  const continueToTimerMode = (habit: Habit, goalRef: string) => {
    setPendingGoalRef(goalRef);
    setTimerBackTo("goal-picker");
    setGoalPickHabit(null);
    setPendingActivity({
      id: habit.activity_uid,
      uid: habit.activity_uid,
      name: habit.activity_name,
      type: habit.activity_type,
    });
  };

  const handleBackToActivityPicker = () => {
    if (timerBackTo === "goal-picker") {
      const habit = allHabits.find((h) => h.activity_uid === pendingActivity?.uid);
      setPendingActivity(null);
      if (habit) setGoalPickHabit(habit);
      return;
    }
    setPendingActivity(null);
    setIsActivityModalOpen(true);
  };

  const handleStartWithMode = (clockType: ClockType, durationSeconds: number) => {
    const activity = pendingActivity;
    if (!activity) return;
    setPendingActivity(null);

    const activityRef = activity.uid ?? activity.id;
    const ratesParam = buildRatesParam(activity);
    const modeParam = `&clockType=${clockType}${clockType === "timer" ? `&duration=${durationSeconds}` : ""}`;

    router.push(`/goals/${pendingGoalRef}/session/new?activity=${activityRef}${ratesParam}${modeParam}`);
  };

  return (
    <StrengthInfoContext.Provider value={setStrengthInfoHabit}>
    <DndContext
      sensors={sensors}
      // Vertical auto-scroll only: dragging toward the right sidebar must
      // not drag the layout sideways (threshold 0 disables the x edge zone).
      autoScroll={{ threshold: { x: 0, y: 0.2 } }}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
    <main className="h-screen w-full bg-gray-100 dark:bg-dark-1 overflow-hidden">
      <div className="mx-auto w-full px-2 py-6 md:px-4">
        <div className="flex w-full gap-6">
          {/* LEFT MAIN CONTENT */}
          <div className="flex-1 md:w-[90%] lg:w-[60%] h-screen overflow-y-auto overflow-x-hidden noscrollbar py-4 px-3 md:px-12">
            {/* Title */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-black dark:text-[var(--foreground)]">
                  Habits
                </h1>
                <span className="flex items-center gap-1 rounded-full bg-gray-500/10 text-gray-600 dark:text-gray-400 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                  <BeakerIcon className="w-3 h-3" />
                  Beta
                </span>
              </div>

              <div className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-1 shadow-sm">
                <Link
                  href="/goals"
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors cursor-pointer text-gray-500 dark:text-[var(--muted)] hover:bg-gray-100 dark:hover:bg-dark-3"
                >
                  <SquaresPlusIcon className="w-4 h-4" />
                  Goals
                </Link>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors cursor-pointer"
                  style={{ backgroundColor: tabAccentColor, color: "#fff" }}
                >
                  <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                  Habits
                </button>
              </div>
            </div>

            <div className="flex mt-3 gap-3">
              <button
                type="button"
                onClick={handleOpenEmptySessionModal}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gray-200 dark:bg-dark-2 text-black dark:text-[var(--foreground)] font-semibold py-4 px-5 hover:bg-gray-300 dark:hover:bg-dark-3 transition cursor-pointer"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Free Session</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenNewHabit()}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gray-200 dark:bg-dark-2 text-black dark:text-[var(--foreground)] font-semibold py-4 px-5 hover:bg-gray-300 dark:hover:bg-dark-3 transition cursor-pointer"
              >
                <ArrowPathRoundedSquareIcon className="w-5 h-5" />
                <span>New Habit</span>
              </button>
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={categories.length >= MAX_HABIT_CATEGORIES || isCreatingCategory}
                aria-label="New habit category"
                title={
                  categories.length >= MAX_HABIT_CATEGORIES
                    ? `You can have at most ${MAX_HABIT_CATEGORIES} habit categories`
                    : "New habit category"
                }
                className="flex items-center justify-center rounded-2xl bg-gray-200 dark:bg-dark-2 text-black dark:text-[var(--foreground)] px-5 hover:bg-gray-300 dark:hover:bg-dark-3 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-200 dark:disabled:hover:bg-dark-2"
              >
                <FolderPlusIcon className="w-5 h-5" />
              </button>
            </div>

            {showHabitsSkeleton ? (
              <div className="mt-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <HabitCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              // Each droppable section stays a drop target even when empty --
              // otherwise dragging a habit here from a category or Frozen has
              // nowhere valid to land and the drop silently no-ops.
              allHabits.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center text-center py-16 px-6">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-dark-3 flex items-center justify-center mb-4">
                    <ArrowPathRoundedSquareIcon className="w-8 h-8 text-gray-500 dark:text-[var(--muted)]" />
                  </div>
                  <h3 className="text-lg font-bold text-black dark:text-[var(--foreground)] mb-1">
                    No habits tracked yet
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-[var(--muted)] max-w-xs">
                    Mark an activity as a habit from its page to start tracking it here.
                  </p>
                </div>
              ) : (
                <div className="mt-6 flex flex-col gap-6 min-h-[75vh]">
                  <HabitSection
                    title="Today"
                    count={todayHabits.length}
                    collapsed={collapsedSections.today}
                    onToggle={() => toggleSection("today")}
                    droppableId={TODAY_CONTAINER_ID}
                  >
                    {(() => {
                      // Insert the live drop gap before the Nth "other" card
                      // (the card being dragged doesn't count as a neighbor).
                      const nodes: React.ReactNode[] = [];
                      let othersSeen = 0;
                      const placeholder = todayDropPreview && (
                        <TodayDropPlaceholder key="today-drop-placeholder" preview={todayDropPreview} />
                      );
                      for (const habit of todayHabits) {
                        const isDragged = draggingHabit?.id === habit.id;
                        if (!isDragged) {
                          if (todayDropPreview && othersSeen === todayDropPreview.index) nodes.push(placeholder);
                          othersSeen += 1;
                        }
                        nodes.push(
                          <DraggableHabit
                            key={habit.id}
                            habit={habit}
                            scope="today"
                            collapseWhileDragging
                          >
                            <HabitCard
                              habit={habit}
                              variant="today"
                              fadeFromFrozen={fadeFrom[habit.id]}
                              onStart={() => handleStartHabitSession(habit)}
                              onEdit={() => setEditingHabit(habit)}
                              onTimeChange={(time, opts) => handleTodayTimeChange(habit, time, opts)}
                            />
                          </DraggableHabit>,
                        );
                      }
                      if (todayDropPreview && todayDropPreview.index >= othersSeen) nodes.push(placeholder);
                      return nodes;
                    })()}
                  </HabitSection>

                  {doneHabits.length > 0 && (
                    <HabitSection
                      title="Done"
                      count={doneHabits.length}
                      collapsed={collapsedSections.done}
                      onToggle={() => toggleSection("done")}
                    >
                      {doneHabits.map((habit) => (
                        // Not draggable: nothing moves into or out of Done.
                        <DraggableHabit key={habit.id} habit={habit} scope="done" disabled>
                          <HabitCard
                            habit={habit}
                            variant="done"
                            fadeFromFrozen={fadeFrom[habit.id]}
                            onStart={() => handleStartHabitSession(habit)}
                            onEdit={() => setEditingHabit(habit)}
                          />
                        </DraggableHabit>
                      ))}
                    </HabitSection>
                  )}

                  <HabitSection
                    title="Unplanned"
                    count={unplannedHabits.length}
                    collapsed={collapsedSections.unplanned}
                    onToggle={() => toggleSection("unplanned")}
                    droppableId={UNPLANNED_CONTAINER_ID}
                    className="flex-1"
                  >
                    {unplannedHabits.map((habit) => (
                      <DraggableHabit key={habit.id} habit={habit} scope="unplanned">
                        <HabitCard
                          habit={habit}
                          variant="unplanned"
                          fadeFromFrozen={fadeFrom[habit.id]}
                          onStart={() => handleAddToToday(habit)}
                          onEdit={() => setEditingHabit(habit)}
                        />
                      </DraggableHabit>
                    ))}
                  </HabitSection>
                </div>
              )
            )}

            <div className="h-8" />
          </div>

          {/* RIGHT SIDEBAR (DESKTOP ONLY) */}
          <aside className="w-[400px] hidden md:flex md:flex-col md:gap-4">
            {categoriesLoading && categories.length === 0 ? (
              <>
                <HabitCategoryCardSkeleton />
                <FrozenHabitsCardSkeleton />
              </>
            ) : (
              <>
                {categories.map((category) => (
                  <HabitCategoryCard
                    key={category.id}
                    category={category}
                    onAddHabit={() => handleOpenNewHabit(category.id)}
                    fadeFrom={fadeFrom}
                    onAddToToday={handleAddToToday}
                    onRenameCategory={(name) => handleRenameCategory(category.id, name)}
                    onDelete={() => handleDeleteCategory(category)}
                  />
                ))}
                <FrozenHabitsCard
                  habits={frozenHabits}
                  freezingHabitId={freezingHabitId}
                  onUnfreeze={handleToggleFreeze}
                  fadeFrom={fadeFrom}
                />
              </>
            )}
          </aside>
        </div>
      </div>

      {/* New Activity Modal */}
      <NewActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSelectActivity={handleSelectActivity}
      />

      {goalPickHabit && (
        <GoalPickerPopup
          isOpen
          onClose={() => setGoalPickHabit(null)}
          activityName={goalPickHabit.activity_name}
          accentColor={ACTIVITY_META[goalPickHabit.activity_type].cssColorVar}
          onSelectGoal={(goal) => continueToTimerMode(goalPickHabit, goal.uid)}
          onStartFree={() => continueToTimerMode(goalPickHabit, "none")}
        />
      )}

      {/* Pick Timer Mode Popup — conditionally mounted so its internal
          Timer/Stopwatch selection always starts fresh on each open */}
      {pendingActivity && (
        <PickTimerModePopup
          isOpen
          activityUid={pendingActivity.uid ?? pendingActivity.id}
          activityName={pendingActivity.name}
          activityType={pendingActivity.type}
          onBack={handleBackToActivityPicker}
          onClose={() => setPendingActivity(null)}
          onStart={handleStartWithMode}
        />
      )}

      {/* New Habit Modal — reuses the same activity-picker UI as Free
          Session/goal activity selection, just pointed at the habit
          candidates endpoint (top non-habit activities) instead of the
          full activities list. */}
      <NewActivityModal
        isOpen={isNewHabitModalOpen}
        onClose={() => {
          setIsNewHabitModalOpen(false);
          setAddingToCategoryId(null);
        }}
        onSelectActivity={handlePickHabitCandidate}
        candidatesMode
      />

      {strengthInfoHabit && (
        <StrengthInfoPopup
          isOpen
          onClose={() => setStrengthInfoHabit(null)}
          accentColor={
            strengthInfoHabit.is_frozen
              ? FROZEN_COLOR
              : ACTIVITY_META[strengthInfoHabit.activity_type].cssColorVar
          }
          currentTier={strengthInfoHabit.strength_tier}
        />
      )}

      {/* Edit Habit Modal */}
      <EditHabitModal
        isOpen={editingHabit !== null}
        habitId={editingHabit?.id ?? null}
        initialName={editingHabit?.custom_name ?? ""}
        activityName={editingHabit?.activity_name ?? ""}
        onClose={() => setEditingHabit(null)}
        onSave={handleSaveHabitName}
        onDelete={handleDeleteHabit}
        isSaving={isSavingHabitName}
        isDeleting={isDeletingHabit}
        accentColor={tabAccentColor}
      />
    </main>
    <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
      {draggingHabit ? <DragGhost habit={draggingHabit} /> : null}
    </DragOverlay>
    </DndContext>
    </StrengthInfoContext.Provider>
  );
}

// The gap shown in the Today list where a dragged habit would land. Grows
// open (height transition) so the cards below visibly make room, and shows
// the time the habit would get.
function TodayDropPlaceholder({ preview }: { preview: TodayDropPreview }) {
  const settled = useSettled(true);
  const { hour12, minute, pm } = to12Hour(preview.time);
  return (
    <div
      aria-hidden
      className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-[var(--border)] text-sm font-semibold text-gray-500 dark:text-[var(--muted)] overflow-hidden transition-[height] duration-150"
      style={{ height: settled ? preview.height : 0 }}
    >
      {`${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${pm ? "PM" : "AM"}`}
    </div>
  );
}

// Collapsible section header + list, like the sections in Apple Reminders:
// title, item count, and a chevron that rotates when collapsed. Optionally a
// drop target (the header counts as part of it, so a collapsed section can
// still be dropped on).
function HabitSection({
  title,
  count,
  collapsed,
  onToggle,
  droppableId,
  className,
  children,
}: {
  title: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  droppableId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  // The whole section (header included) is the drop target so a collapsed
  // section can still be dropped on, but the highlight ring only wraps the
  // list body, keeping it clear of the heading text.
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId ?? "__not-droppable__",
    disabled: !droppableId,
  });
  const accent = useMasteryAccent();
  const showRing = !!droppableId && isOver;

  return (
    <div ref={droppableId ? setNodeRef : undefined} className={`flex flex-col ${className ?? ""}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="w-full flex items-center gap-2 py-1 cursor-pointer text-left"
      >
        <h2 className="text-lg font-semibold text-black dark:text-[var(--foreground)]">{title}</h2>
        <span className="text-lg font-semibold text-gray-500 dark:text-[var(--muted)]">{count}</span>
        <ChevronDownIcon
          className={`ml-auto w-5 h-5 text-gray-500 dark:text-[var(--muted)] transition-transform ${
            collapsed ? "-rotate-90" : ""
          }`}
          strokeWidth={2.5}
        />
      </button>
      {!collapsed && (
        <div
          className={`mt-4 flex-1 space-y-3 rounded-2xl transition-colors ${droppableId ? "min-h-16" : ""}`}
          style={
            showRing
              ? {
                  boxShadow: `0 0 0 2px ${accent.rgba(accent.primary, 0.7)}`,
                  backgroundColor: accent.rgba(accent.primary, 0.05),
                }
              : undefined
          }
        >
          {children}
        </div>
      )}
    </div>
  );
}

// A floating, slightly-scaled/tilted preview of whatever's being dragged —
// rendered in a portal by DragOverlay so it's never clipped by the
// scrolling main column or the sidebar, and always on top.
function DragGhost({ habit }: { habit: Habit }) {
  const color = habit.is_frozen ? FROZEN_COLOR : ACTIVITY_META[habit.activity_type].cssColorVar;
  return (
    <div
      className={`flex items-center gap-2 rounded-xl bg-white dark:bg-dark-2 px-3 py-2.5 shadow-2xl ${
        habit.is_frozen ? "border border-transparent" : "border border-gray-200 dark:border-[var(--border)]"
      }`}
      // Frozen tint is layered over the opaque card bg so the floating ghost
      // never turns see-through.
      style={{
        transform: "rotate(-2deg) scale(1.03)",
        cursor: "grabbing",
        backgroundImage: habit.is_frozen ? `linear-gradient(${FROZEN_BG}, ${FROZEN_BG})` : undefined,
      }}
    >
      <HabitStrengthBars
        tier={habit.strength_tier}
        accentColor={color}
        frozen={habit.is_frozen}
        size="sm"
      />
      <p className="text-sm font-semibold text-black dark:text-[var(--foreground)] truncate max-w-[220px]">
        {habit.display_name}
      </p>
    </div>
  );
}

// Wraps a container's children with useDroppable, giving a soft highlight
// (ring + tint) while something is being dragged over it — the main
// "where will this land" affordance.
function DroppableContainer({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const accent = useMasteryAccent();
  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ""} transition-colors`}
      style={
        isOver
          ? { boxShadow: `0 0 0 2px ${accent.rgba(accent.primary, 0.7)}`, backgroundColor: accent.rgba(accent.primary, 0.05) }
          : undefined
      }
    >
      {children}
    </div>
  );
}

// Makes any habit row/card draggable without changing its own markup —
// grab cursor, a brief opacity dip on the original spot while its ghost
// follows the pointer via DragOverlay, and a small lift (shadow + scale)
// right before drag officially starts so the pickup itself feels tactile.
function DraggableHabit({
  habit,
  scope,
  disabled = false,
  collapseWhileDragging = false,
  children,
}: {
  habit: Habit;
  // Folds the original card away while it's being dragged, so the list
  // closes up around the gap the drop preview is showing.
  collapseWhileDragging?: boolean;
  // Which list this copy renders in -- a categorized habit scheduled for
  // today shows in two lists at once, so ids must be unique per list.
  scope: "today" | "done" | "unplanned" | "category" | "frozen";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `habit-${scope}-${habit.id}`,
    data: { habit },
    disabled,
  });
  // A drag ends with a click event on the same element; remember that this
  // press turned into a drag so it doesn't also navigate.
  const draggedRef = useRef(false);
  useEffect(() => {
    if (isDragging) draggedRef.current = true;
  }, [isDragging]);

  return (
    <div
      ref={setNodeRef}
      data-today-item={scope === "today" ? habit.id : undefined}
      {...listeners}
      {...attributes}
      onPointerDownCapture={() => {
        draggedRef.current = false;
      }}
      onClick={(e) => {
        if (draggedRef.current) return;
        // Buttons/links inside the card keep their own behavior.
        if ((e.target as HTMLElement).closest("button, a, input, [data-no-card-click]")) return;
        router.push(`/habits/${habit.activity_uid}`);
      }}
      style={{
        // The DragOverlay ghost is the only thing that follows the pointer:
        // the original is hidden (not dimmed, not translated) while dragging.
        opacity: isDragging ? 0 : 1,
        touchAction: "none",
        ...(isDragging && collapseWhileDragging
          ? { height: 0, overflow: "hidden", marginTop: 0 }
          : null),
      }}
      className={`cursor-pointer ${disabled ? "" : "active:cursor-grabbing"} transition-[opacity,transform] duration-150`}
    >
      {children}
    </div>
  );
}

// variant: "today" and "done" show a play button to start a session;
// "unplanned" shows + to schedule the habit for today. Done is dimmed.
function HabitCard({
  habit,
  variant,
  fadeFromFrozen,
  onStart,
  onEdit,
  onTimeChange,
}: {
  habit: Habit;
  variant: "today" | "done" | "unplanned";
  onTimeChange?: (time: string, opts?: { immediate?: boolean }) => void;
  fadeFromFrozen?: boolean;
  onStart: () => void;
  onEdit: () => void;
}) {
  const aspectColor = ACTIVITY_META[habit.activity_type].cssColorVar;
  const settled = useSettled(fadeFromFrozen === true);
  const openStrengthInfo = useContext(StrengthInfoContext);

  return (
    <div
      className={`relative w-full rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-4 flex items-center gap-4 ${
        variant === "done" ? "opacity-60" : ""
      }`}
    >
      {fadeFromFrozen === true && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            backgroundColor: FROZEN_BG,
            opacity: settled ? 0 : 1,
            transition: `opacity ${FREEZE_FADE_MS}ms ease`,
          }}
        />
      )}
      <HabitStrengthBars
        tier={habit.strength_tier}
        accentColor={aspectColor}
        size="lg"
        title={strengthTooltip(habit)}
        onClick={() => openStrengthInfo(habit)}
      />

      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-lg font-semibold text-black dark:text-[var(--foreground)] truncate">
            {habit.display_name}
          </p>
          <StrengthBadge habit={habit} />
        </div>
        <DayProgressRow habit={habit} />
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {variant === "today" && onTimeChange ? (
          <TodayTimeControl
            value={habit.today_time ?? DEFAULT_TODAY_TIME}
            onChange={onTimeChange}
          />
        ) : (
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit habit name"
            className="h-10 w-10 flex items-center justify-center cursor-pointer rounded-xl bg-gray-100 dark:bg-dark-3 text-gray-600 dark:text-[var(--muted)] transition hover:bg-gray-200 dark:hover:bg-[var(--dark-2)]"
          >
            <PencilSquareIcon className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onStart();
          }}
          aria-label={variant === "unplanned" ? "Add to today" : "Start session"}
          // Play and + are both muted grays, like secondary actions.
          className="h-10 w-10 flex items-center justify-center cursor-pointer rounded-xl transition bg-gray-500/15 text-gray-500 dark:text-gray-400 hover:bg-gray-500/25"
        >
          {variant === "unplanned" ? <PlusIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

// S M T W T F S row under the habit name — bordered day buttons:
// active (filled, aspect color) = a completed session that day,
// muted = day already passed with nothing logged, inactive = day hasn't
// happened yet this week.
function DayProgressRow({ habit }: { habit: Habit }) {
  const meta = ACTIVITY_META[habit.activity_type];
  // Defensive fallback: a stale/dev backend not yet serving week_progress
  // (or an unexpected payload) shouldn't crash the whole card -- render all
  // days as "not yet happened" rather than throwing.
  const { today = -1, progress = [] } = habit.week_progress ?? {};

  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      {WEEKDAY_LABELS.map((label, index) => {
        const isDone = progress[index];
        const isFuture = index > today;

        return (
          <span
            key={index}
            title={label}
            className={
              isDone && !isFuture
                ? "flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-[11px] font-semibold"
                : isFuture
                  ? "flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 dark:border-[var(--border)] text-[11px] font-semibold text-gray-400 dark:text-[var(--muted)]"
                  : "flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 dark:border-[var(--border)] text-[11px] font-semibold text-gray-300 dark:text-[var(--muted)] opacity-50"
            }
            style={
              isDone && !isFuture
                ? {
                    backgroundColor: `color-mix(in srgb, ${meta.cssColorVar} 20%, transparent)`,
                    color: meta.cssColorVar,
                  }
                : undefined
            }
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

// Signal-strength-style 3-bar ascending meter for a Habit's strength_tier.
// Deliberately no numbers/percentage — see the habit strength design spec:
// the bar count alone is the entire interface, filled bars never read as a
// warning/failure state even at `dormant` (0 filled). Stacked with the tier
// label underneath so it reads as one unit on the left of the habit card.
function HabitStrengthBars({
  tier,
  accentColor,
  size = "sm",
  title,
  frozen = false,
  onClick,
}: {
  tier: StrengthTier;
  accentColor: string;
  size?: "xs" | "sm" | "lg";
  title?: string;
  frozen?: boolean;
  onClick?: () => void;
}) {
  const filled = STRENGTH_TIER_BARS[tier];
  // Taller, wider bars than the original spec geometry -- bar height now
  // maxes out at 52 within a 62-high viewBox, each bar 10 wide, so the
  // whole meter reads noticeably bigger vertically than earlier passes.
  const bars = [
    { height: 16, y: 39 },
    { height: 30, y: 25 },
    { height: 45, y: 10 },
  ];
  const dims =
    size === "lg" ? { width: 64, height: 62 } : size === "xs" ? { width: 32, height: 32 } : { width: 40, height: 40 };

  return (
    <div
      className={`flex flex-col items-center gap-0.5 shrink-0 ${onClick ? "cursor-pointer" : ""}`}
      title={title ?? STRENGTH_TIER_LABEL[tier]}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
    >
      <svg
        width={dims.width}
        height={dims.height}
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
            fill={index < filled || frozen ? accentColor : "transparent"}
            fillOpacity={index < filled || !frozen ? undefined : 0.2}
            className={
              index < filled || frozen
                ? undefined
                : "stroke-gray-500 dark:stroke-gray-500 opacity-50"
            }
            stroke={index < filled || !frozen ? undefined : accentColor}
            strokeOpacity={index < filled || !frozen ? undefined : 0.4}
            strokeWidth={index < filled ? 0 : 1.5}
          />
        ))}
      </svg>
      {size !== "xs" && (
        <span className="text-[11px] text-gray-500 ">
          {STRENGTH_TIER_LABEL[tier]}
        </span>
      )}
    </div>
  );
}

function HabitCardSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-4 flex items-center gap-4 animate-pulse">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="h-8 w-12 rounded bg-gray-200 dark:bg-dark-3" />
        <div className="h-2.5 w-10 rounded bg-gray-200 dark:bg-dark-3" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-dark-3" />
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-6 w-6 rounded-md bg-gray-200 dark:bg-dark-3" />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-dark-3" />
        <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-dark-3" />
        <div className="h-10 w-16 rounded-xl bg-gray-200 dark:bg-dark-3" />
      </div>
    </div>
  );
}

// Sidebar card for one HabitCategory: its active habits as compact rows
// (emoji + name, aspect-colored Start button), plus a dotted "+ Add Habit"
// box that opens the same candidates picker as the main "New Habit"
// button, scoped to land directly in this category.
function HabitCategoryCard({
  category,
  onAddHabit,
  fadeFrom,
  onAddToToday,
  onRenameCategory,
  onDelete,
}: {
  category: HabitCategory;
  onAddHabit: () => void;
  onAddToToday: (habit: Habit) => void;
  fadeFrom: Record<number, boolean>;
  onRenameCategory: (name: string) => void;
  onDelete: () => void;
}) {
  // Local draft so the user's in-progress typing is never clobbered by a
  // parent re-render (e.g. another category's rename landing) -- only
  // re-synced when this is genuinely a different category (id changes).
  const [nameDraft, setNameDraft] = useState(category.name);
  useEffect(() => {
    setNameDraft(category.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id]);

  const commitRename = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDraft(category.name);
      return;
    }
    if (trimmed !== category.name) {
      onRenameCategory(trimmed);
    }
  };

  const accent = useMasteryAccent();

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-4">
      <div className="flex items-center gap-2 mb-3">
      <input
        type="text"
        value={nameDraft}
        onChange={(e) => setNameDraft(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        style={{ "--tw-ring-color": accent.primary } as React.CSSProperties}
        className="min-w-0 flex-1 text-lg font-medium text-black dark:text-white bg-transparent outline-none focus:ring-2 rounded-md px-1 -mx-1"
      />
      {!category.is_default && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${category.name}`}
          title="Delete category"
          className="shrink-0 p-1 cursor-pointer text-gray-400 dark:text-[var(--muted)] hover:text-red-500 transition"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      )}
      </div>

      <DroppableContainer id={categoryContainerId(category.id)} className="space-y-2 rounded-xl min-h-12">
        {/* Habits done today sink to the bottom, dimmed with a check circle. */}
        {[
          ...category.habits.filter((h) => !h.is_frozen && !isDoneToday(h)),
          ...category.habits.filter((h) => !h.is_frozen && isDoneToday(h)),
        ].map((habit) => (
          <DraggableHabit key={habit.id} habit={habit} scope="category">
            <CompactHabitRow
              habit={habit}
              action={isDoneToday(habit) ? "done" : habit.today ? "scheduled" : "add"}
              onAdd={() => onAddToToday(habit)}
              fadeFromFrozen={fadeFrom[habit.id]}
            />
          </DraggableHabit>
        ))}

        <button
          type="button"
          onClick={onAddHabit}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 dark:border-[var(--border)] text-sm font-semibold text-gray-500 dark:text-[var(--muted)] py-2.5 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-[var(--foreground)] transition cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          Add Habit
        </button>
      </DroppableContainer>
    </div>
  );
}

// Compact sidebar row shared by category cards and the Frozen card:
// strength meter, name, 7 thin textless day bars (same done/missed/future
// styling as DayProgressRow) and a chevron to the habit detail page.
// Frozen rows swap the aspect color for cyan everywhere.
// action: "add" = + button that schedules the habit for today, "scheduled" =
// already in Today so no button, "done" = dimmed row with a check circle,
// "chevron" = link to the habit page (Frozen card).
function CompactHabitRow({
  habit,
  action,
  onAdd,
  fadeFromFrozen,
  trailing,
}: {
  habit: Habit;
  action: "add" | "scheduled" | "done" | "chevron";
  onAdd?: () => void;
  fadeFromFrozen?: boolean;
  trailing?: React.ReactNode;
}) {
  const color = habit.is_frozen ? FROZEN_COLOR : ACTIVITY_META[habit.activity_type].cssColorVar;
  const { today = -1, progress = [] } = habit.week_progress ?? {};
  // Background/border fade from the card's previous look (frozen or not) to
  // its current one right after a freeze toggle.
  const settled = useSettled(fadeFromFrozen !== undefined);
  const openStrengthInfo = useContext(StrengthInfoContext);
  const looksFrozen = fadeFromFrozen === undefined || settled ? habit.is_frozen : fadeFromFrozen;

  return (
    <div
      className={`flex items-stretch gap-2 rounded-xl border px-3 py-4 ${
        action === "done" ? "opacity-60" : ""
      } ${
        looksFrozen
          ? "border-transparent dark:border-transparent"
          : "border-gray-200 dark:border-[var(--border)]"
      }`}
      style={{
        backgroundColor: looksFrozen ? FROZEN_BG : "rgba(6, 182, 212, 0)",
        transition: `background-color ${FREEZE_FADE_MS}ms ease, border-color ${FREEZE_FADE_MS}ms ease`,
      }}
    >
      <div className="flex items-center">
        <HabitStrengthBars
          tier={habit.strength_tier}
          accentColor={color}
          frozen={habit.is_frozen}
          size="xs"
          title={strengthTooltip(habit)}
          onClick={() => openStrengthInfo(habit)}
        />
      </div>
      <div className="min-w-0 flex-1 self-center text-left flex items-center gap-1.5">
        <p className="min-w-0 text-sm font-semibold text-black dark:text-[var(--foreground)] truncate">
          {habit.display_name}
        </p>
        <StrengthBadge habit={habit} small />
      </div>
      {trailing}
      {!habit.is_frozen && (
      <div className="flex items-stretch gap-0.5 shrink-0">
        {WEEKDAY_LABELS.map((label, index) => {
          const isFuture = index > today;
          const isDone = !!progress[index] && !isFuture;
          return (
            <span
              key={index}
              className={`w-1.5 rounded-full border ${
                isDone
                  ? ""
                  : isFuture
                    ? "border-gray-200 dark:border-[var(--border)]"
                    : "border-gray-200 dark:border-[var(--border)] opacity-50"
              }`}
              style={isDone ? { backgroundColor: color, borderColor: color } : undefined}
            />
          );
        })}
      </div>
      )}
      {action === "chevron" && (
        <Link
          href={`/habits/${habit.activity_uid}`}
          aria-label={`View ${habit.display_name}`}
          style={{ backgroundColor: color }}
          className="shrink-0 self-center h-8 w-8 flex items-center justify-center cursor-pointer rounded-lg text-white hover:opacity-90 transition"
        >
          <ChevronRightIcon className="w-4 h-4" strokeWidth={3.5} />
        </Link>
      )}
      {action === "add" && (
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add ${habit.display_name} to today`}
          className="shrink-0 self-center h-6 w-6 flex items-center justify-center cursor-pointer rounded-md transition bg-gray-500/15 text-gray-500 dark:text-gray-400 hover:bg-gray-500/25"
        >
          <PlusOutlineIcon className="w-3.5 h-3.5" strokeWidth={3.5} />
        </button>
      )}
      {action === "done" && (
        <span
          aria-label="Done today"
          title="Done today"
          style={{ backgroundColor: color }}
          className="shrink-0 self-center h-6 w-6 flex items-center justify-center rounded-full text-white"
        >
          <CheckIcon className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  );
}

function HabitCategoryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-4 animate-pulse">
      <div className="h-4 w-28 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-gray-200 dark:bg-dark-3" />
        ))}
        <div className="h-10 rounded-xl border border-dashed border-gray-300 dark:border-[var(--border)]" />
      </div>
    </div>
  );
}

// Sidebar card listing currently-frozen habits with an unfreeze affordance;
// empty state is just a snowflake + encouragement, per spec.
function FrozenHabitsCard({
  habits,
  freezingHabitId,
  onUnfreeze,
  fadeFrom,
}: {
  habits: Habit[];
  freezingHabitId: number | null;
  onUnfreeze: (habit: Habit) => void;
  fadeFrom: Record<number, boolean>;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-4">
      <h3 className="text-lg font-medium mb-3 text-black dark:text-white">
        Frozen Habits
      </h3>

      <DroppableContainer id={FROZEN_CONTAINER_ID} className="rounded-xl min-h-12">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <FaSnowflake className="w-6 h-6 text-gray-500 dark:text-[var(--muted)] mb-2 " />
            <p className="text-sm text-gray-500 dark:text-[var(--muted)]">
              No frozen habits, keep working!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => (
              <DraggableHabit key={habit.id} habit={habit} scope="frozen">
                <CompactHabitRow
                  habit={habit}
                  action="chevron"
                  fadeFromFrozen={fadeFrom[habit.id]}
                  trailing={
                    <button
                      type="button"
                      onClick={() => onUnfreeze(habit)}
                      disabled={freezingHabitId === habit.id}
                      aria-label={`Unfreeze ${habit.display_name}`}
                      title="Unfreeze"
                      className="shrink-0 self-center h-8 w-8 flex items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Droplet className="w-4 h-4" />
                    </button>
                  }
                />
              </DraggableHabit>
            ))}
          </div>
        )}
      </DroppableContainer>
    </div>
  );
}

function FrozenHabitsCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-4 animate-pulse">
      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-dark-3 mb-3" />
      <div className="h-16 rounded-xl bg-gray-200 dark:bg-dark-3" />
    </div>
  );
}
