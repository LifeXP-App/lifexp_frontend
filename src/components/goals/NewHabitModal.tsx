"use client";

import { useQuery } from "@tanstack/react-query";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { ACTIVITY_META, ActivityType } from "@/src/lib/types/activityMeta";

type HabitCandidate = {
  id: number;
  uid: string;
  name: string;
  activity_type: ActivityType;
  emoji: string;
  session_count: number;
};

interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: (candidate: HabitCandidate) => void;
  creatingUid?: string | null;
}

export default function NewHabitModal({
  isOpen,
  onClose,
  onPick,
  creatingUid = null,
}: NewHabitModalProps) {
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["habits", "candidates"],
    queryFn: async () => {
      const res = await authedFetch(`/api/habits/candidates?limit=20`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch habit candidates");
      const data = await res.json();
      return (Array.isArray(data.results) ? data.results : []) as HabitCandidate[];
    },
    enabled: isOpen,
    staleTime: 30 * 1000,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-100 dark:bg-dark-2 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden dark:border dark:border-[var(--border)] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[var(--dark-1)] shrink-0">
          <h2 className="text-xl font-bold text-black dark:text-[var(--foreground)]">
            New Habit
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

        <div className="px-6 py-4 overflow-y-auto noscrollbar">
          <p className="text-sm text-gray-500 dark:text-[var(--muted)] mb-4">
            Pick an activity you already do often to start tracking it as a habit.
          </p>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-white dark:bg-dark-3 animate-pulse"
                />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4">
              <p className="text-sm text-gray-500 dark:text-[var(--muted)]">
                No activities left to turn into a habit yet. Complete a few sessions first.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {candidates.map((candidate) => (
                <HabitCandidateRow
                  key={candidate.id}
                  candidate={candidate}
                  isCreating={creatingUid === candidate.uid}
                  disabled={!!creatingUid}
                  onPick={() => onPick(candidate)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HabitCandidateRow({
  candidate,
  isCreating,
  disabled,
  onPick,
}: {
  candidate: HabitCandidate;
  isCreating: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  const meta = ACTIVITY_META[candidate.activity_type];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-dark-3 border border-gray-200 dark:border-[var(--border)] hover:bg-gray-50 dark:hover:bg-dark-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-left"
    >
      <div className="text-xl leading-none shrink-0">{candidate.emoji}</div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-black dark:text-[var(--foreground)] truncate">
          {candidate.name}
        </p>
        <p
          className="text-xs"
          style={{ color: meta?.cssColorVar }}
        >
          {candidate.session_count} session{candidate.session_count === 1 ? "" : "s"}
        </p>
      </div>
      {isCreating && (
        <div className="shrink-0 h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
      )}
    </button>
  );
}
