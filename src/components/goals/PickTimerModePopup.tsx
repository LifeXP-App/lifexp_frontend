"use client";

import { useState } from "react";
import { ClockIcon, PlayCircleIcon } from "@heroicons/react/24/outline";

export type ClockType = "timer" | "stopwatch";

// A 5-character shift-register buffer — H MM SS — read left to right as
// hours (1 digit) : minutes (2 digits) : seconds (2 digits). Typing a digit
// drops the leftmost character and appends the new one at the end, like a
// digital stopwatch's "set" mode; backspace does the reverse (drops the
// rightmost, pads a 0 at the front). Defaults to 25:00.
const DEFAULT_DIGITS = "02500";
const MAX_FOCUS_SECONDS = 3 * 60 * 60;

function digitsToParts(digits: string) {
  return {
    hours: parseInt(digits[0], 10),
    minutes: parseInt(digits.slice(1, 3), 10),
    seconds: parseInt(digits.slice(3, 5), 10),
  };
}

function digitsToSeconds(digits: string) {
  const { hours, minutes, seconds } = digitsToParts(digits);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatDigits(digits: string) {
  const { hours, minutes, seconds } = digitsToParts(digits);
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const STORAGE_KEY_PREFIX = "pickTimerMode:";

interface StoredMode {
  clockType: ClockType;
  digits: string;
}

// Per-activity "remember my last choice" — read once per mount (this popup
// is always freshly mounted on open, see the note below), so an activity the
// user always runs as a stopwatch reopens on Stopwatch, and one they always
// timebox to 10 minutes reopens with 0:10:00 already filled in. Written only
// when the user actually changes clockType or the duration, not on every
// render. Per-viewer convenience only — not synced anywhere, so it's fine to
// keep in localStorage rather than Django/Convex.
function readStoredMode(activityUid: string | undefined): StoredMode | null {
  if (!activityUid || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + activityUid);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      (parsed.clockType === "timer" || parsed.clockType === "stopwatch") &&
      typeof parsed.digits === "string" &&
      /^\d{5}$/.test(parsed.digits)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredMode(activityUid: string | undefined, mode: StoredMode) {
  if (!activityUid || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_PREFIX + activityUid, JSON.stringify(mode));
  } catch {
    // Storage can be unavailable (private browsing, quota) — losing the
    // remembered preference isn't worth failing the popup over.
  }
}

export interface PickTimerModePopupProps {
  isOpen: boolean;
  activityUid?: string;
  activityName?: string;
  onBack: () => void;
  onClose: () => void;
  onStart: (clockType: ClockType, durationSeconds: number) => void;
}

export default function PickTimerModePopup({
  isOpen,
  activityUid,
  activityName,
  onBack,
  onClose,
  onStart,
}: PickTimerModePopupProps) {
  // No reset-on-reopen effect needed: callers only ever render this popup
  // while `isOpen` is true (conditionally mounting it), so a fresh instance
  // — and fresh initial state — is created each time it's opened. That also
  // means it's safe to read the remembered mode once here, synchronously, as
  // the initial state.
  const remembered = readStoredMode(activityUid);
  const [clockType, setClockType] = useState<ClockType>(remembered?.clockType ?? "timer");
  const [digits, setDigits] = useState(remembered?.digits ?? DEFAULT_DIGITS);

  if (!isOpen) return null;

  const totalSeconds = digitsToSeconds(digits);
  const isDurationValid = totalSeconds > 0 && totalSeconds <= MAX_FOCUS_SECONDS;

  const handleStart = () => {
    if (clockType === "timer" && !isDurationValid) return;
    onStart(clockType, clockType === "timer" ? totalSeconds : 0);
  };

  const handleSelectClockType = (next: ClockType) => {
    setClockType(next);
    writeStoredMode(activityUid, { clockType: next, digits });
  };

  // Only digit keys mutate the buffer (shift left, append at the end);
  // Backspace shifts the other way (drop the last digit, pad a 0 at the
  // front). Everything else (arrows, tab, colon display, etc.) is left
  // alone — there's no caret to manage since the field never reflects a
  // literal cursor position within the formatted text.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const next = (digits + e.key).slice(-5);
      setDigits(next);
      writeStoredMode(activityUid, { clockType, digits: next });
    } else if (e.key === "Backspace") {
      e.preventDefault();
      const next = ("0" + digits).slice(0, 5);
      setDigits(next);
      writeStoredMode(activityUid, { clockType, digits: next });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4 animate-backdrop-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-100 dark:bg-dark-1 dark:border dark:border-[var(--border)] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transition-all duration-200 animate-dialog-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex bg-white dark:bg-[var(--dark-2)] items-center justify-between px-5 pt-5 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-xl font-bold text-foreground dark:text-[var(--foreground)]">
            {activityName ? `Start ${activityName}` : "Pick Timer Mode"}
          </h2>
        </div>

        {/* Content */}
        <div className="p-5 flex gap-3">
          {/* Timer card */}
          <button
            type="button"
            onClick={() => handleSelectClockType("timer")}
            className={`flex-1 h-48 flex flex-col items-center justify-center gap-4 rounded-2xl transition-all cursor-pointer border ${
              clockType === "timer" ? "" : "bg-white dark:bg-dark-2"
            }`}
            style={{
              backgroundColor:
                clockType === "timer" ? "rgba(var(--rookie-primary-rgb), 0.15)" : undefined,
              borderColor:
                clockType === "timer" ? "rgba(var(--rookie-primary-rgb), 0.4)" : "var(--border)",
            }}
          >
            <ClockIcon
              className={`w-10 h-10 ${clockType === "timer" ? "" : "text-gray-400 dark:text-[var(--muted)]"}`}
              style={clockType === "timer" ? { color: "var(--rookie-primary)" } : undefined}
            />
            <span
              className={`font-bold text-sm ${clockType === "timer" ? "" : "text-gray-500 dark:text-[var(--muted)]"}`}
              style={clockType === "timer" ? { color: "var(--rookie-primary)" } : undefined}
            >
              Timer
            </span>

            <input
              type="text"
              inputMode="numeric"
              readOnly={clockType !== "timer"}
              tabIndex={clockType === "timer" ? 0 : -1}
              value={formatDigits(digits)}
              onKeyDown={clockType === "timer" ? handleKeyDown : undefined}
              onChange={() => {}}
              onClick={(e) => e.stopPropagation()}
              className={`w-24 text-center text-2xl font-bold bg-transparent outline-none border-b pb-0.5 ${
                clockType === "timer" ? "" : "cursor-default text-gray-400 dark:text-[var(--muted)]"
              }`}
              style={
                clockType === "timer"
                  ? { borderColor: "rgba(var(--rookie-primary-rgb), 0.4)", color: "var(--rookie-primary)" }
                  : { borderColor: "var(--border)" }
              }
            />
          </button>

          {/* Stopwatch card */}
          <button
            type="button"
            onClick={() => handleSelectClockType("stopwatch")}
            className={`flex-1 h-48 flex flex-col items-center justify-center gap-4 rounded-2xl transition-all cursor-pointer border ${
              clockType === "stopwatch" ? "" : "bg-white dark:bg-dark-2"
            }`}
            style={{
              backgroundColor:
                clockType === "stopwatch" ? "rgba(var(--rookie-primary-rgb), 0.15)" : undefined,
              borderColor:
                clockType === "stopwatch" ? "rgba(var(--rookie-primary-rgb), 0.4)" : "var(--border)",
            }}
          >
            <PlayCircleIcon
              className={`w-10 h-10 ${clockType === "stopwatch" ? "" : "text-gray-400 dark:text-[var(--muted)]"}`}
              style={clockType === "stopwatch" ? { color: "var(--rookie-primary)" } : undefined}
            />
            <span
              className={`font-bold text-sm ${clockType === "stopwatch" ? "" : "text-gray-500 dark:text-[var(--muted)]"}`}
              style={clockType === "stopwatch" ? { color: "var(--rookie-primary)" } : undefined}
            >
              Stopwatch
            </span>
            <span className={`text-4xl ${
                clockType === "stopwatch" ? "" : "cursor-default text-gray-400 dark:text-[var(--muted)]"
              }`} style={
                clockType === "stopwatch"
                  ? { borderColor: "rgba(var(--rookie-primary-rgb), 0.4)", color: "var(--rookie-primary)" }
                  : { borderColor: "var(--border)" }
              }>
                ∞
            </span>

          </button>
        </div>

        {/* Bottom Buttons */}
        <div
          className="p-5 pt-3 grid grid-cols-2 gap-3 border-t bg-white dark:bg-[var(--dark-1)] border-gray-200 dark:border-[var(--border)]"
        >
          <button
            type="button"
            onClick={onBack}
            className="py-3 px-4 rounded-xl font-medium active:opacity-80 text-white bg-gray-600 dark:bg-[var(--dark-3)] hover:bg-gray-700 dark:hover:bg-[var(--dark-3)] transition-all cursor-pointer"
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleStart}
            disabled={clockType === "timer" && !isDurationValid}
            className="py-3 px-4 rounded-xl font-medium active:opacity-80 text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--rookie-primary)" }}
          >
            Start Activity
          </button>
        </div>
      </div>
    </div>
  );
}
