"use client";

interface StatusChangeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStatus: string;
  newStatus: string;
  goalTitle: string;
}

export default function StatusChangeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus,
  goalTitle,
}: StatusChangeConfirmationModalProps) {
  if (!isOpen) return null;

  // Get appropriate message based on transition
  const getMessage = () => {
    if (newStatus === 'abandoned') {
      return {
        title: 'Abandon Goal?',
        message: `Are you sure you want to abandon "${goalTitle}"? This action marks the goal as abandoned.`,
        confirmText: 'Yes, Abandon',
        confirmColor: 'bg-red-600 hover:bg-red-700',
      };
    }

    if (newStatus === 'completed') {
      return {
        title: 'Mark as Completed?',
        message: `Mark "${goalTitle}" as completed?`,
        confirmText: 'Mark Complete',
        confirmColor: 'bg-green-600 hover:bg-green-700',
      };
    }

    if (newStatus === 'paused') {
      return {
        title: 'Pause Goal?',
        message: `Pause "${goalTitle}"? You can resume it later.`,
        confirmText: 'Pause Goal',
        confirmColor: 'bg-yellow-600 hover:bg-yellow-700',
      };
    }

    if (newStatus === 'ongoing' && currentStatus === 'paused') {
      return {
        title: 'Resume Goal?',
        message: `Resume working on "${goalTitle}"?`,
        confirmText: 'Resume',
        confirmColor: 'bg-blue-600 hover:bg-blue-700',
      };
    }

    if (newStatus === 'ongoing' && currentStatus === 'planned') {
      return {
        title: 'Start Goal?',
        message: `Mark "${goalTitle}" as ongoing?`,
        confirmText: 'Start Goal',
        confirmColor: 'bg-blue-600 hover:bg-blue-700',
      };
    }

    // Default
    return {
      title: 'Change Status?',
      message: `Change "${goalTitle}" status to ${newStatus}?`,
      confirmText: 'Confirm',
      confirmColor: 'bg-blue-600 hover:bg-blue-700',
    };
  };

  const { title, message, confirmText, confirmColor } = getMessage();

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-dark-2 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-black dark:text-white">
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-600 dark:text-gray-300">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 dark:bg-dark-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 rounded-xl font-semibold text-white transition cursor-pointer ${confirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
