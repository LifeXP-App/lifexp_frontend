"use client";

import { useEffect, useState } from "react";

interface EditHabitModalProps {
  isOpen: boolean;
  habitId: number | null;
  initialName: string;
  activityName: string;
  onClose: () => void;
  onSave: (habitId: number, customName: string) => void;
  onDelete: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  /** Mastery accent color when the viewer has a real mastery, rookie blue
   * otherwise — same convention as the rest of the Goals/Habits UI. */
  accentColor: string;
}

export default function EditHabitModal({
  isOpen,
  habitId,
  initialName,
  activityName,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  accentColor,
}: EditHabitModalProps) {
  const [name, setName] = useState(initialName);

  // Re-sync to whichever habit this got opened for, each time it opens.
  useEffect(() => {
    if (!isOpen) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setName(initialName);
  }, [isOpen, initialName]);

  if (!isOpen || habitId === null) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(habitId, name.trim());
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 bg-opacity-50 z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-100 dark:bg-dark-2 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden dark:border dark:border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[var(--dark-1)]">
          <h2 className="text-xl font-bold text-black dark:text-[var(--foreground)]">
            Edit Habit
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

        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-6">
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-black dark:text-[var(--foreground)]">
                Habit name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={activityName}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-dark-3 text-black dark:text-[var(--foreground)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <p className="text-xs text-gray-400 dark:text-[var(--muted)] mt-2">
                Leave blank to use the activity name ({activityName}).
              </p>
            </div>
          </div>

          <div className="mt-4 p-6 w-full bg-white dark:bg-[var(--dark-1)] border-t border-gray-200 dark:border-[var(--border)] space-y-3">
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="w-full py-3 rounded-2xl font-semibold text-white text-base active:opacity-80 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: accentColor }}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isSaving || isDeleting}
              className="w-full py-3 rounded-2xl font-semibold text-red-600 dark:text-red-400 text-base active:opacity-80 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20"
            >
              {isDeleting ? "Deleting..." : "Delete Habit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
