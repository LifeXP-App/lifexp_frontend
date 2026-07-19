"use client";

import { useEffect, useState } from "react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
  error: string | null;
}

const CONFIRM_WORD = "Confirm";

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  deleting,
  error,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");

  // Reset the typed confirmation whenever the modal closes, so it doesn't
  // silently stay "armed" the next time it's opened.
  useEffect(() => {
    if (!isOpen) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setConfirmText("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmed = confirmText === CONFIRM_WORD;

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={deleting ? undefined : onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-dark-2 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[var(--border)]">
          <h2 className="text-xl font-bold text-black dark:text-[var(--foreground)]">
            Delete Account?
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-600 dark:text-[var(--muted)]">
            This permanently deletes your account and all of your goals, sessions, and XP. This action cannot be undone.
          </p>

          <label className="block mt-4">
            <span className="text-sm text-gray-600 dark:text-[var(--muted)]">
              Type{" "}
              <span className="font-semibold text-black dark:text-[var(--foreground)]">
                {CONFIRM_WORD}
              </span>{" "}
              to confirm
            </span>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={deleting}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={CONFIRM_WORD}
              className="mt-2 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--dark-1)] text-black dark:text-[var(--foreground)] outline-none focus:border-red-700 dark:focus:border-red-700 transition-colors disabled:opacity-50"
            />
          </label>

          {error && (
            <p className="mt-3 text-sm text-red-700 dark:text-red-700">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-3 border-t border-gray-200 dark:border-[var(--border)]">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-3 rounded-xl font-semibold text-gray-700 dark:text-[var(--muted)] bg-gray-200 dark:bg-[var(--dark-3)] hover:bg-gray-300 dark:hover:bg-[var(--dark-3)] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting || !isConfirmed}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition cursor-pointer bg-red-700 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
