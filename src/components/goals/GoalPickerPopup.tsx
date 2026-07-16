"use client";

import { useEffect, useState } from "react";
import { PlayIcon } from "@heroicons/react/24/solid";
import { GoalsService, Goal } from "@/src/lib/services/goals";
import StatusBadge from "@/src/components/goals/StatusBadge";

interface GoalPickerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  activityName: string;
  accentColor: string;
  onSelectGoal: (goal: Goal) => void;
  onStartFree: () => void;
}

export default function GoalPickerPopup({
  isOpen,
  onClose,
  activityName,
  accentColor,
  onSelectGoal,
  onStartFree,
}: GoalPickerPopupProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setLoading(true);
    setError(null);
    setLaunchingId(null);

    GoalsService.getGoals({ page_size: 50 })
      .then((res) => {
        if (cancelled) return;
        setGoals(
          res.results.filter(
            (g) => g.status === "ongoing" || g.status === "planned",
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load goals");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (goal: Goal) => {
    if (launchingId) return;
    setLaunchingId(goal.id);
    onSelectGoal(goal);
  };

  const handleFree = () => {
    if (launchingId) return;
    setLaunchingId("free");
    onStartFree();
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden bg-white dark:border dark:border-[var(--border)] dark:bg-dark-1 shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="text-xl font-bold text-foreground dark:text-[var(--foreground)] leading-tight">
              Start {activityName}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Pick a goal to log this session under
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Goal list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[72px] rounded-2xl bg-gray-100 dark:bg-dark-3 animate-pulse"
              />
            ))
          ) : error ? (
            <p
              className="text-sm text-center py-8"
              style={{ color: "var(--muted)" }}
            >
              {error}
            </p>
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8 px-2">
              <span className="text-4xl mb-3">🎯</span>
              <h3 className="text-base font-bold text-foreground dark:text-[var(--foreground)]">
                No active goals
              </h3>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Create a goal first to log {activityName} sessions under it,
                or start a free session below.
              </p>
            </div>
          ) : (
            goals.map((goal) => (
              <button
                key={goal.id}
                type="button"
                disabled={launchingId !== null}
                onClick={() => handleSelect(goal)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-dark-3 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ backgroundColor: `${accentColor}26` }}
                >
                  {goal.emoji || "🎯"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-foreground dark:text-[var(--foreground)]">
                    {goal.title}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={goal.status === "active" ? "ongoing" : goal.status} />
                  </div>
                </div>

                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor:
                      launchingId === goal.id ? `${accentColor}80` : accentColor,
                  }}
                >
                  {launchingId === goal.id ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <PlayIcon className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Start Free Session */}
        <div
          className="p-4 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            type="button"
            disabled={launchingId !== null}
            onClick={handleFree}
            className="w-full py-3 rounded-2xl font-medium text-white transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: "#4a4a4a" }}
          >
            {launchingId === "free" ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
            <span>Start Free Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
