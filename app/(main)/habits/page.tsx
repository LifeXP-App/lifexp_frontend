"use client";

import { useMasteryAccent } from "@/src/lib/hooks/useMasteryAccent";
import { useAuth } from "@/src/context/AuthContext";
import { useToast, useConfirm } from "@/src/context/ToastContext";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { setGoalsNavPreference } from "@/src/lib/hooks/useGoalsNavPreference";
import {
  SquaresPlusIcon,
  ArrowPathRoundedSquareIcon,
  PlusIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  PlayIcon,
  BeakerIcon,
  FolderPlusIcon,
} from "@heroicons/react/24/solid";
import { FaSnowflake } from "react-icons/fa";
import { ACTIVITY_META, ActivityType } from "@/src/lib/types/activityMeta";
import type { ClockType } from "@/src/components/goals/PickTimerModePopup";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
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
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const NewActivityModal = dynamic(
  () => import("@/src/components/goals/NewActivityModel"),
);
const PickTimerModePopup = dynamic(
  () => import("@/src/components/goals/PickTimerModePopup"),
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

type Habit = {
  id: number;
  activity_uid: string;
  activity_name: string;
  activity_type: ActivityType;
  activity_emoji: string;
  category_id: number | null;
  category_name: string | null;
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
};

type HabitCategory = {
  id: number;
  name: string;
  is_default: boolean;
  created_at: string;
  habits: Habit[];
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const STRENGTH_TIER_LABEL: Record<StrengthTier, string> = {
  dormant: "Dormant",
  light: "Light",
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

// Drop container ids. "main" = uncategorized list, "frozen" = the Frozen
// Habits card, "category-<id>" = a specific HabitCategoryCard.
const MAIN_CONTAINER_ID = "main";
const FROZEN_CONTAINER_ID = "frozen";
const categoryContainerId = (categoryId: number) => `category-${categoryId}`;

function containerIdForHabit(habit: Habit): string {
  if (habit.is_frozen) return FROZEN_CONTAINER_ID;
  if (habit.category_id) return categoryContainerId(habit.category_id);
  return MAIN_CONTAINER_ID;
}

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
  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState(false);
  const [addingToCategoryId, setAddingToCategoryId] = useState<number | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isSavingHabitName, setIsSavingHabitName] = useState(false);
  const [isDeletingHabit, setIsDeletingHabit] = useState(false);
  const [freezingHabitId, setFreezingHabitId] = useState<number | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [draggingHabit, setDraggingHabit] = useState<Habit | null>(null);

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
  const frozenHabits = habits.filter((h) => h.is_frozen);

  // Soonest next_predicted_occurrence first; habits with no prediction yet
  // (not enough history -- see main.habits.MIN_WEEKS_FOR_PREDICTION) sort
  // to the end rather than being treated as "furthest away". Main list is
  // uncategorized + unfrozen only -- a frozen or categorized habit lives in
  // its own card in the sidebar instead (see containerIdForHabit).
  const sortedHabits = [...habits]
    .filter((h) => !h.is_frozen && !h.category_id)
    .sort((a, b) => {
      if (!a.next_predicted_occurrence && !b.next_predicted_occurrence) return 0;
      if (!a.next_predicted_occurrence) return 1;
      if (!b.next_predicted_occurrence) return -1;
      return a.next_predicted_occurrence.localeCompare(b.next_predicted_occurrence);
    });

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

  const handleToggleFreeze = async (habit: Habit) => {
    setFreezingHabitId(habit.id);
    try {
      const res = await authedFetch(`/api/habits/${habit.id}/freeze`, {
        method: habit.is_frozen ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to update freeze state");
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success(habit.is_frozen ? "Habit unfrozen." : "Habit frozen.");
    } catch {
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

  const handleDragStart = (event: DragStartEvent) => {
    const habit = event.active.data.current?.habit as Habit | undefined;
    if (habit) setDraggingHabit(habit);
  };

  const handleDragCancel = () => {
    setDraggingHabit(null);
  };

  // Applies the new category/frozen state to both query caches immediately
  // (so the dragged card visually lands in its new container with no
  // flicker), then fires whichever backend requests the move actually
  // requires, and rolls back if either fails.
  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggingHabit(null);
    const { active, over } = event;
    if (!over) return;

    const habit = active.data.current?.habit as Habit | undefined;
    if (!habit) return;

    const targetContainerId = String(over.id);
    const sourceContainerId = containerIdForHabit(habit);
    if (targetContainerId === sourceContainerId) return;

    // Dropping on Frozen only toggles is_frozen -- category is untouched
    // (frozen is a cross-cutting flag, not a container the habit "lives
    // in"). Dropping on main/a category always unfreezes, since the only
    // way out of Frozen is dragging to one of those.
    const nextIsFrozen = targetContainerId === FROZEN_CONTAINER_ID;
    const nextCategoryId = nextIsFrozen
      ? habit.category_id
      : targetContainerId.startsWith("category-")
        ? Number(targetContainerId.slice("category-".length))
        : null;

    const prevHabits = habits;
    const prevCategories = categories;

    const applyHabitChange = (h: Habit): Habit => ({
      ...h,
      category_id: nextCategoryId,
      category_name:
        categories.find((c) => c.id === nextCategoryId)?.name ?? null,
      is_frozen: nextIsFrozen,
    });

    // Optimistic update: patch the flat habits list, and rebuild each
    // category's nested `habits` array so the card the habit left/joined
    // both update without a refetch round-trip.
    queryClient.setQueryData<Habit[]>(["habits"], (prev = []) =>
      prev.map((h) => (h.id === habit.id ? applyHabitChange(h) : h)),
    );
    queryClient.setQueryData<HabitCategory[]>(["habits", "categories"], (prev = []) =>
      prev.map((c) => ({
        ...c,
        habits:
          c.id === nextCategoryId
            ? [...c.habits.filter((h) => h.id !== habit.id), applyHabitChange(habit)]
            : c.habits.filter((h) => h.id !== habit.id),
      })),
    );

    try {
      const categoryChanged = nextCategoryId !== habit.category_id;
      const frozenChanged = nextIsFrozen !== habit.is_frozen;

      if (categoryChanged) {
        const res = await authedFetch(`/api/habits/${habit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category_id: nextCategoryId }),
        });
        if (!res.ok) throw new Error("Failed to move habit");
      }
      if (frozenChanged) {
        const res = await authedFetch(`/api/habits/${habit.id}/freeze`, {
          method: nextIsFrozen ? "POST" : "DELETE",
        });
        if (!res.ok) throw new Error("Failed to update freeze state");
      }
    } catch {
      queryClient.setQueryData(["habits"], prevHabits);
      queryClient.setQueryData(["habits", "categories"], prevCategories);
      toast.error("Failed to move habit. Please try again.");
    }
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
    setPendingActivity(activity);
  };

  // Habit cards already know their activity — skip the picker and go
  // straight to the timer-mode popup, same as selecting it there would.
  const handleStartHabitSession = (habit: Habit) => {
    setPendingActivity({
      id: habit.activity_uid,
      uid: habit.activity_uid,
      name: habit.activity_name,
    });
  };

  const handleBackToActivityPicker = () => {
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

    router.push(`/goals/none/session/new?activity=${activityRef}${ratesParam}${modeParam}`);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
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
            ) : sortedHabits.length === 0 ? (
              <div className="mt-12 flex flex-col items-center justify-center text-center py-16 px-6">
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
              <DroppableContainer id={MAIN_CONTAINER_ID} className="mt-6 space-y-3 rounded-2xl">
                {sortedHabits.map((habit) => (
                  <DraggableHabit key={habit.id} habit={habit}>
                    <HabitCard
                      habit={habit}
                      onStart={() => handleStartHabitSession(habit)}
                      onEdit={() => setEditingHabit(habit)}
                    />
                  </DraggableHabit>
                ))}
              </DroppableContainer>
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
                    onStartHabit={handleStartHabitSession}
                    onEditHabit={setEditingHabit}
                    onRenameCategory={(name) => handleRenameCategory(category.id, name)}
                  />
                ))}
                <FrozenHabitsCard
                  habits={frozenHabits}
                  freezingHabitId={freezingHabitId}
                  onUnfreeze={handleToggleFreeze}
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

      {/* Pick Timer Mode Popup — conditionally mounted so its internal
          Timer/Stopwatch selection always starts fresh on each open */}
      {pendingActivity && (
        <PickTimerModePopup
          isOpen
          activityUid={pendingActivity.uid ?? pendingActivity.id}
          activityName={pendingActivity.name}
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
  );
}

// A floating, slightly-scaled/tilted preview of whatever's being dragged —
// rendered in a portal by DragOverlay so it's never clipped by the
// scrolling main column or the sidebar, and always on top.
function DragGhost({ habit }: { habit: Habit }) {
  const aspectColor = ACTIVITY_META[habit.activity_type].cssColorVar;
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 px-3 py-2.5 shadow-2xl"
      style={{ transform: "rotate(-2deg) scale(1.03)", cursor: "grabbing" }}
    >
      <HabitStrengthBars tier={habit.strength_tier} accentColor={aspectColor} size="sm" />
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
  children,
}: {
  habit: Habit;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `habit-${habit.id}`,
    data: { habit },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.35 : 1,
        touchAction: "none",
      }}
      className="cursor-grab active:cursor-grabbing transition-[opacity,transform] duration-150"
    >
      {children}
    </div>
  );
}

function HabitCard({
  habit,
  onStart,
  onEdit,
}: {
  habit: Habit;
  onStart: () => void;
  onEdit: () => void;
}) {
  const aspectColor = ACTIVITY_META[habit.activity_type].cssColorVar;

  return (
    <div className="w-full rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 p-4 flex items-center gap-4">
      <HabitStrengthBars tier={habit.strength_tier} accentColor={aspectColor} size="lg" />

      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <p className="text-lg font-semibold text-black dark:text-[var(--foreground)] truncate">
          {habit.display_name}
        </p>
        <DayProgressRow habit={habit} />
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit habit name"
          className="h-10 w-10 flex items-center justify-center cursor-pointer rounded-xl bg-gray-100 dark:bg-dark-3 text-gray-600 dark:text-[var(--muted)] transition hover:bg-gray-200 dark:hover:bg-[var(--dark-2)]"
        >
          <PencilSquareIcon className="w-5 h-5" />
        </button>
        <Link
          href={`/habits/${habit.activity_uid}`}
          aria-label="View habit history"
          className="h-10 w-10 flex items-center justify-center cursor-pointer rounded-xl bg-gray-100 dark:bg-dark-3 text-gray-600 dark:text-[var(--muted)] transition hover:bg-gray-200 dark:hover:bg-[var(--dark-2)]"
        >
          <CalendarDaysIcon className="w-5 h-5" />
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onStart();
          }}
          aria-label="Start session"
          style={{ backgroundColor: aspectColor }}
          className="h-10 w-10 flex items-center justify-center cursor-pointer rounded-xl text-white hover:opacity-90 transition"
        >
          <PlayIcon className="w-5 h-5" />
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
                ? "flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-semibold text-white"
                : isFuture
                  ? "flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 dark:border-[var(--border)] text-[11px] font-semibold text-gray-400 dark:text-[var(--muted)]"
                  : "flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 dark:border-[var(--border)] text-[11px] font-semibold text-gray-300 dark:text-[var(--muted)] opacity-50"
            }
            style={
              isDone && !isFuture
                ? { backgroundColor: meta.cssColorVar, borderColor: meta.cssColorVar }
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
}: {
  tier: StrengthTier;
  accentColor: string;
  size?: "xs" | "sm" | "lg";
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
    size === "lg" ? { width: 64, height: 62 } : size === "xs" ? { width: 22, height: 22 } : { width: 40, height: 40 };

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
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
            fill={index < filled ? accentColor : "transparent"}
            className={
              index < filled
                ? undefined
                : "stroke-gray-500 dark:stroke-gray-500 opacity-50"
            }
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
  onStartHabit,
  onEditHabit,
  onRenameCategory,
}: {
  category: HabitCategory;
  onAddHabit: () => void;
  onStartHabit: (habit: Habit) => void;
  onEditHabit: (habit: Habit) => void;
  onRenameCategory: (name: string) => void;
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
      <input
        type="text"
        value={nameDraft}
        onChange={(e) => setNameDraft(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        style={{ "--tw-ring-color": accent.primary } as React.CSSProperties}
        className="w-full text-lg font-medium mb-3 text-black dark:text-white bg-transparent outline-none focus:ring-2 rounded-md px-1 -mx-1"
      />

      <DroppableContainer id={categoryContainerId(category.id)} className="space-y-2 rounded-xl min-h-12">
        {category.habits.map((habit) => {
          const aspectColor = ACTIVITY_META[habit.activity_type].cssColorVar;
          return (
            <DraggableHabit key={habit.id} habit={habit}>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[var(--border)] p-2.5">
                <HabitStrengthBars tier={habit.strength_tier} accentColor={aspectColor} size="xs" />
                <button
                  type="button"
                  onClick={() => onEditHabit(habit)}
                  className="min-w-0 flex-1 text-left cursor-pointer"
                >
                  <p className="text-sm font-semibold text-black dark:text-[var(--foreground)] truncate">
                    {habit.display_name}
                  </p>
                  {habit.is_frozen && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 dark:text-[var(--muted)] mt-0.5">
                      <FaSnowflake className="w-2.5 h-2.5" />
                      Frozen
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onStartHabit(habit)}
                  aria-label={`Start ${habit.activity_name}`}
                  style={{ backgroundColor: aspectColor }}
                  className="shrink-0 h-8 w-8 flex items-center justify-center cursor-pointer rounded-lg text-white hover:opacity-90 transition"
                >
                  <PlayIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </DraggableHabit>
          );
        })}

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
}: {
  habits: Habit[];
  freezingHabitId: number | null;
  onUnfreeze: (habit: Habit) => void;
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
              <DraggableHabit key={habit.id} habit={habit}>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[var(--border)] p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-black dark:text-[var(--foreground)] truncate">
                      {habit.display_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUnfreeze(habit)}
                    disabled={freezingHabitId === habit.id}
                    className="shrink-0 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {freezingHabitId === habit.id ? "..." : "Unfreeze"}
                  </button>
                </div>
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
