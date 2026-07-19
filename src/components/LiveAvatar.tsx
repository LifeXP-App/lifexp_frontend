"use client";

import type { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Wraps any avatar <img>/<Image> and overlays a live indicator (green ring +
 * pulsing dot; amber when paused) whenever that user has a live session in
 * Convex. Clicking a live avatar navigates to the session's spectator view —
 * navigation uses onClick with preventDefault/stopPropagation so this is safe
 * to nest inside an existing <Link> (e.g. a post header linking to a profile).
 *
 * All instances share one Convex subscription (identical queries are deduped
 * by the Convex client), so sprinkling this across the app is cheap.
 */
export function LiveAvatar({
  username,
  userId,
  children,
  className,
}: {
  username?: string | null;
  /** Django user id — fallback matcher for surfaces that don't have a username */
  userId?: string | number | null;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const sessions = useQuery(api.sessions.getLiveSessions);
  const live =
    username || userId != null
      ? sessions?.find(
          (s) =>
            (username && s.username === username) ||
            (userId != null && s.userId === String(userId))
        )
      : undefined;

  if (!live) {
    return (
      <span className={`relative inline-block ${className ?? ""}`}>
        {children}
      </span>
    );
  }

  // Three states: focusing (green), on a pomodoro break (blue — around and
  // interactable), manually paused (amber). Pulse for green/blue since the
  // person is present; static dot for a manual pause.
  const isPaused = live.status === "paused";
  const onBreak = isPaused && live.onBreak;
  const color = !isPaused ? "#22c55e" : onBreak ? "#3b82f6" : "#f59e0b";
  const pulse = !isPaused || onBreak;

  const goToSession = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/goals/${live.goalId}/session/${live._id}`);
  };

  return (
    <span
      className={`relative inline-block cursor-pointer ${className ?? ""}`}
      onClick={goToSession}
      title={
        onBreak
          ? "On a break"
          : isPaused
          ? "Session paused"
          : "Watch live session"
      }
    >
      {children}
      <span
        className="pointer-events-none absolute inset-0 rounded-full border-2"
        style={{ borderColor: color }}
      />
      <span
        className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 rounded-full border-2 border-white dark:border-dark-2"
        style={{ backgroundColor: color }}
      >
        {pulse && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: color }}
          />
        )}
      </span>
    </span>
  );
}
