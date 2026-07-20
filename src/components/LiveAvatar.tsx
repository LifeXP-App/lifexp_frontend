"use client";

import { api } from "@/convex/_generated/api";
import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

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
            (userId != null && s.userId === String(userId)),
        )
      : undefined;

  if (!live) {
    return (
      <span className={`relative inline-flex ${className ?? ""}`}>
        {children}
      </span>
    );
  }

  // Three states: focusing (the activity's aspect color — e.g. purple for
  // logic, so the ring hints what they're doing), on a pomodoro break (blue —
  // around and interactable), manually paused (amber). Pulse for
  // focusing/break since the person is present; static dot for a manual pause.
  const isPaused = live.status === "paused";
  const onBreak = isPaused && live.onBreak;
  const activityColor = live.activityType
    ? ACTIVITY_META[live.activityType as ActivityType]?.cssColorVar
    : undefined;
  const color = !isPaused
    ? (activityColor ?? "#22c55e")
    : onBreak
      ? "#3b82f6"
      : "#f59e0b";
  const pulse = !isPaused || onBreak;

  const goToSession = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/goals/${live.goalId}/session/${live._id}`);
  };

  return (
    <span
      className={`relative inline-flex cursor-pointer ${className ?? ""}`}
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
      {/* Ring sits a hair outside the avatar's edge (small gap) rather than
          flush against it. */}
      <span
        className="pointer-events-none absolute -inset-0.75 rounded-full border-3"
        style={{ borderColor: color }}
      />
      {/* Discord-style status dot, centered exactly on the ring's circumference
          at its 45°/bottom-right point (a circle inscribed in a square never
          reaches the box's corner, so corner-relative offsets like `-bottom-0
          -right-0` leave a gap — percentage position + centering transform
          puts it precisely on the curve regardless of avatar size). The small
          fixed px term accounts for the ring now sitting 3px outside the
          avatar rather than flush against it. */}
      <span
        className="absolute flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-dark-2"
        style={{
          backgroundColor: color,
          top: "calc(85.36% + 2.12px)",
          left: "calc(85.36% + 2.12px)",
        }}
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
