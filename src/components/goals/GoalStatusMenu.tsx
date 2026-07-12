"use client";

import { useState, useRef, useEffect } from "react";

interface GoalStatusMenuProps {
  goalId: string;
  currentStatus: 'planned' | 'ongoing' | 'paused' | 'completed' | 'abandoned';
  onStatusChange: (goalId: string, newStatus: string) => void;
  onDelete: (goalId: string) => void;
}

export default function GoalStatusMenu({
  goalId,
  currentStatus,
  onStatusChange,
  onDelete,
}: GoalStatusMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Define available actions based on current status
  const getActions = () => {
    const actions: Array<{ label: string; value: string; color: string }> = [];

    if (currentStatus === 'ongoing') {
      actions.push({
        label: 'Pause Goal',
        value: 'paused',
        color: 'text-black dark:text-[var(--foreground)]'
      });
      actions.push({
        label: 'Mark as Completed',
        value: 'completed',
        color: 'text-black dark:text-[var(--foreground)]'
      });
    }

    if (currentStatus === 'paused') {
      actions.push({
        label: 'Resume Goal',
        value: 'ongoing',
        color: 'text-black dark:text-[var(--foreground)]'
      });
      actions.push({
        label: 'Mark as Completed',
        value: 'completed',
        color: 'text-black dark:text-[var(--foreground)]'
      });
    }

    // Always allow abandon/cancel (except if already abandoned)
    if (currentStatus !== 'abandoned' && currentStatus !== 'completed') {
      actions.push({
        label: 'Abandon Goal',
        value: 'abandoned',
        color: 'text-red-700 dark:text-red-500'
      });
    }

    return actions;
  };

  const actions = getActions();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="p-2 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--dark-2)] transition-colors"
        aria-label="Goal status menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="6" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="18" r="2" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 w-48 bg-white dark:bg-dark-2 border border-gray-200 dark:border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-20"
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((action) => (
            <button
              key={action.value}
              type="button"
              className={`w-full cursor-pointer text-left font-medium py-3 px-4 text-sm hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors ${action.color}`}
              onClick={() => {
                setOpen(false);
                onStatusChange(goalId, action.value);
              }}
            >
              {action.label}
            </button>
          ))}

          {actions.length > 0 && (
            <div className="border-t border-gray-200 dark:border-[var(--border)]" />
          )}

          <button
            type="button"
            className="w-full cursor-pointer text-left font-medium py-3 px-4 text-sm hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors text-red-700 dark:text-red-500"
            onClick={() => {
              setOpen(false);
              onDelete(goalId);
            }}
          >
            Delete Goal
          </button>
        </div>
      )}
    </div>
  );
}
