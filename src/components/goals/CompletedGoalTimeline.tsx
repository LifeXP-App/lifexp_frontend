"use client";

import { CheckIcon, ClockIcon } from "@heroicons/react/24/solid";
import GoalStatusMenu from "@/src/components/goals/GoalStatusMenu";
import { useMasteryPrimaryColor } from "@/src/lib/hooks/useMasteryAccent";

export interface CompletedGoalItem {
  uid: string;
  emoji: string;
  title: string;
  description: string;
  totalXp?: number;
  timeSpent?: string;
  picture?: string | null;
  // ISO date the goal was completed (falls back to last update).
  completedAt?: string | null;
}

interface CompletedGoalTimelineProps {
  goals: CompletedGoalItem[];
  onOpen: (uid: string) => void;
  onStatusChange: (goalId: string, newStatus: string) => void;
  onEdit: (goalId: string) => void;
  onDelete: (goalId: string) => void;
}

// More than this many days between two completed goals adds extra space.
const LONG_GAP_DAYS = 20;

const monthKey = (iso?: string | null) => {
  if (!iso) return "Earlier";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "Earlier"
    : d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const calendarParts = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    month: d.toLocaleDateString(undefined, { month: "short" }),
    day: d.getDate(),
  };
};

// Completed goals as a vertical timeline, newest first: a rail down the left
// with a check dot per goal, month markers between groups, and a card with a
// 4:3 achievement thumbnail beside the title, a short blurb and the total XP.
export default function CompletedGoalTimeline({
  goals,
  onOpen,
  onStatusChange,
  onEdit,
  onDelete,
}: CompletedGoalTimelineProps) {
  const primaryColor = useMasteryPrimaryColor();

  const sorted = [...goals].sort(
    (a, b) =>
      (new Date(b.completedAt ?? 0).getTime() || 0) -
      (new Date(a.completedAt ?? 0).getTime() || 0),
  );

  return (
    <div className="relative pl-16">
      {/* The rail: starts at the first calendar tile (below the first month heading), nothing above it */}
      <div
        className="absolute left-[27px] top-11 bottom-2 w-0.5 rounded-full bg-gray-200 dark:bg-[var(--border)]"
        aria-hidden
      />

      <div className="space-y-6">
        {sorted.map((goal, index) => {
          const month = monthKey(goal.completedAt);
          const showMonth = index === 0 || month !== monthKey(sorted[index - 1].completedAt);
          // A long stretch between two completions gets extra breathing room.
          const gapDays =
            index === 0
              ? 0
              : (new Date(sorted[index - 1].completedAt ?? 0).getTime() -
                  new Date(goal.completedAt ?? 0).getTime()) /
                86_400_000;
          const hasLongGap = gapDays > LONG_GAP_DAYS;

          return (
            <div key={goal.uid} className={hasLongGap ? "pt-10" : undefined}>
              {showMonth && (
                <p className="mb-3 text-sm font-semibold text-gray-500 dark:text-[var(--muted)]">
                  {month}
                </p>
              )}

              <div className="relative">
                {/* Calendar tile on the rail (same look as the habit page's Next tile) */}
                <div
                  className="absolute -left-16 top-3 w-14 h-14 flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 shadow-sm ring-4 ring-gray-100 dark:ring-dark-1"
                  aria-hidden
                >
                  <div className="shrink-0 bg-gray-100 dark:bg-dark-3 text-center leading-none py-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-[var(--muted)]">
                      {calendarParts(goal.completedAt)?.month ?? "Done"}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span
                      className="text-xl font-extrabold leading-none"
                      style={{ color: primaryColor }}
                    >
                      {calendarParts(goal.completedAt)?.day ?? <CheckIcon className="mx-auto h-5 w-5" />}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => onOpen(goal.uid)}
                  className="rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-2 cursor-pointer transition hover:shadow-md"
                >
                  <div className="flex gap-4 p-3">
                    {/* Picture at a 4:3 thumbnail (or a tinted question-mark tile when there isn't one) */}
                    <div className="relative w-28 sm:w-40 aspect-[4/3] shrink-0 overflow-hidden rounded-xl">
                      {goal.picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={goal.picture}
                          alt={goal.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className="h-full w-full flex items-center justify-center text-4xl"
                          style={{
                            background: `linear-gradient(135deg, color-mix(in srgb, ${primaryColor} 35%, transparent), color-mix(in srgb, ${primaryColor} 8%, transparent))`,
                          }}
                        >
                          <span role="img" aria-label="No image uploaded">?</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1 flex flex-col py-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-lg text-black dark:text-[var(--foreground)] truncate">
                            ? {goal.title}
                          </p>
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                          <GoalStatusMenu
                            goalId={goal.uid}
                            currentStatus="completed"
                            onEdit={onEdit}
                            onStatusChange={onStatusChange}
                            onDelete={onDelete}
                          />
                        </div>
                      </div>

                      {goal.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-[var(--muted)] line-clamp-2">
                          {goal.description}
                        </p>
                      )}

                      <div className="mt-auto pt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        {typeof goal.totalXp === "number" && (
                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {goal.totalXp.toLocaleString()} XP
                          </span>
                        )}
                        {goal.timeSpent && (
                          <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-[var(--muted)]">
                            <ClockIcon className="h-4 w-4 text-gray-400 dark:text-[var(--muted)]" />
                            {goal.timeSpent}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
