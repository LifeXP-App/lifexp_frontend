"use client";

interface DeleteSessionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  xpEarned?: number;
}

export default function DeleteSessionConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  xpEarned = 0,
}: DeleteSessionConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-dark-2 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[var(--border)]">
          <h2 className="text-xl font-bold text-black dark:text-[var(--foreground)]">
            Delete Session?
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-600 dark:text-[var(--muted)]">
            This will permanently delete this session. This cannot be undone. You will permanently lose the {xpEarned && `${xpEarned} `} XP this session earned, it cannot be recovered.
          </p>
         
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-3 border-t border-gray-200 dark:border-[var(--border)]">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-gray-700 dark:text-[var(--muted)] bg-gray-200 dark:bg-[var(--dark-3)] hover:bg-gray-300 dark:hover:bg-[var(--dark-3)] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition cursor-pointer bg-red-600 hover:bg-red-700"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}
