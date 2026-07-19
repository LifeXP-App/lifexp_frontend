"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";

/* ---------------- TYPES ---------------- */

export type LiveSessionStatusProps = {
  session: {
    sessionId: string;
    goalId: string;
    goalTitle?: string;
    username?: string;
    userFullname?: string;
    userProfile?: string;
    activityName?: string;
    activityEmoji?: string;
    activityType?: string;
    status: "live" | "paused";
    onBreak?: boolean;
    totalDurationSeconds: number;
  };
};

/* ---------------- HELPERS ---------------- */

function formatElapsed(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/* ---------------- COMPONENT ---------------- */

export function LiveSessionStatus({ session }: LiveSessionStatusProps) {
  const isPaused = session.status === "paused";

  // Tick locally every second while live, so the timer doesn't stall between
  // Convex updates; ticks reset whenever Convex pushes a fresh synced value
  // (adjust-during-render pattern).
  const [ticks, setTicks] = useState(0);
  const [lastSynced, setLastSynced] = useState(session.totalDurationSeconds);
  if (lastSynced !== session.totalDurationSeconds) {
    setLastSynced(session.totalDurationSeconds);
    setTicks(0);
  }

  useEffect(() => {
    if (isPaused) return;
    const ticker = setInterval(() => setTicks((t) => t + 1), 1000);
    return () => clearInterval(ticker);
  }, [isPaused]);

  const elapsedSeconds = session.totalDurationSeconds + (isPaused ? 0 : ticks);

  const activityColor = session.activityType
    ? ACTIVITY_META[session.activityType as ActivityType]?.cssColorVar
    : undefined;
  const activityText = session.activityName
    ? `${session.activityEmoji ?? "✦"} ${session.activityName}`
    : `${session.activityEmoji ?? "✦"} In session`;
  const initial = session.username?.[0]?.toUpperCase() ?? "?";
  const onBreak = isPaused && session.onBreak;
  const liveColor = !isPaused ? "#22c55e" : onBreak ? "#3b82f6" : "#f59e0b";

  return (
    <Link href={`/goals/${session.goalId}/session/${session.sessionId}`}>
      <div className="bg-white dark:bg-dark-2 border-2 border-gray-200 dark:border-[var(--border)] flex p-3 rounded-xl gap-3 min-w-[220px] max-w-[220px] items-center cursor-pointer flex-shrink-0">
        <div className="relative h-14 w-14 flex-shrink-0">
          {session.userProfile ? (
            <Image
              src={session.userProfile}
              width={56}
              height={56}
              alt={session.username ?? "User"}
              className="rounded-full h-14 w-14 aspect-square object-cover p-[1.5px]"
              style={{ border: `2px solid ${liveColor}` }}
              unoptimized
            />
          ) : (
            <div
              className="rounded-full h-14 w-14 flex items-center justify-center font-semibold text-lg bg-gray-200 dark:bg-dark-3 text-gray-600 dark:text-[var(--muted)]"
              style={{ border: `2px solid ${liveColor}` }}
            >
              {initial}
            </div>
          )}
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 rounded-full border-2 border-white dark:border-dark-2"
            style={{ backgroundColor: liveColor }}
          >
            {(!isPaused || onBreak) && (
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: liveColor }}
              />
            )}
          </span>
        </div>

        <div className="flex flex-col justify-between flex-1 min-w-0">
          <h1 className="text-md font-semibold truncate">
            {session.userFullname || session.username || "Someone"}
          </h1>

          <p className="text-xs font-medium text-black/40 dark:text-[var(--foreground)]/40 truncate">
            {session.goalTitle || "Live session"}
          </p>

          <div className="flex items-center">
            <p
              className="font-semibold text-xs ml-1 truncate"
              style={activityColor ? { color: activityColor } : undefined}
            >
              {activityText} ·
            </p>
            <p
              className="font-semibold text-xs ml-1 tabular-nums flex-shrink-0"
              style={{ color: liveColor }}
            >
              {onBreak
                ? "On break"
                : isPaused
                ? "Paused"
                : formatElapsed(elapsedSeconds)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
