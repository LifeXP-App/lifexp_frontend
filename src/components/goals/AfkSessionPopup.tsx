"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import { useConvexActiveSession } from "@/src/lib/hooks/useConvexSessions";
import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";

const FOCUS_SECONDS = 25 * 60;

function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Mirrors the Flutter app's compact live-session bar
// (lifexp_flutter/lib/widgets/layout/main_shell.dart, _LiveSessionBar):
// derives the current Pomodoro focus phase's remaining/elapsed seconds live
// from startedAt/pauseIntervals rather than waiting on the ~5s Convex
// heartbeat, so the display ticks smoothly every second even between syncs.
//
// Uses the exact same pause-aware wall-clock math as the real timer page
// (app/(fullscreen)/goals/[goalId]/session/[sessionId]/page.tsx) so this
// pill never drifts from what the timer page itself shows. One known,
// accepted gap: a custom timer duration picked in PickTimerModePopup isn't
// stored in Convex (client-side/URL-param only, by design — see that
// component), so "timer" mode here always counts down from the 25:00
// default rather than the session's actual chosen length.
function useLiveFocusSeconds(session: {
  startedAt: number;
  pauseIntervals: { pausedAt: number; resumedAt?: number }[];
  focusPhaseStartSeconds?: number;
  focusAdjustSeconds?: number;
  clockType?: "timer" | "stopwatch";
  status: string;
} | null) {
  const [seconds, setSeconds] = useState(FOCUS_SECONDS);

  useEffect(() => {
    if (!session) return;

    const tick = () => {
      const now = Date.now();
      let pausedMs = 0;
      for (const interval of session.pauseIntervals) {
        pausedMs += (interval.resumedAt ?? now) - interval.pausedAt;
      }
      const liveFocusedSecs = Math.max(0, (now - session.startedAt) / 1000 - pausedMs / 1000);

      if (session.clockType === "stopwatch") {
        // Same value the real timer page shows for a stopwatch session:
        // total accrued focused time, full stop.
        setSeconds(Math.floor(liveFocusedSecs));
        return;
      }

      const currentPhaseFocusedSecs = Math.max(
        0,
        liveFocusedSecs - (session.focusPhaseStartSeconds ?? 0),
      );
      const left = Math.max(
        0,
        FOCUS_SECONDS + (session.focusAdjustSeconds ?? 0) - Math.floor(currentPhaseFocusedSecs),
      );
      setSeconds(left);
    };

    tick();
    if (session.status !== "live") return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session]);

  return seconds;
}

export default function AfkSessionPopup() {
  const { me } = useAuth();
  const userId = me ? String(me.id) : null;
  const { session } = useConvexActiveSession(userId);

  const seconds = useLiveFocusSeconds(session ?? null);

  if (!session) {
    return null;
  }

  const clockType = session.clockType ?? "timer";

  const sessionId = session._id;
  const goalId = session.goalId;
  const sessionEmoji = session.activityEmoji || "⌛";
  const activityMeta = session.activityType
    ? ACTIVITY_META[session.activityType as ActivityType]
    : undefined;
  const aspectColor = activityMeta?.cssColorVar ?? "var(--rookie-primary)";
  const aspectColorRgb = activityMeta?.cssColorVarRgb ?? "65, 104, 226";
  const goalTitle = session.goalTitle || "Session";
  const activityName = session.activityName || "Activity";

  if (!sessionId || !goalId) return null;

  // A pomodoro break is a "paused" session whose open pause interval was
  // started with reason "break_started" — same convention the timer page and
  // getLiveSessions (convex/sessions.ts) use to distinguish break from a
  // plain manual pause.
  const lastPauseInterval = session.pauseIntervals[session.pauseIntervals.length - 1];
  const isOnBreak =
    session.status === "paused" &&
    lastPauseInterval !== undefined &&
    lastPauseInterval.resumedAt === undefined &&
    lastPauseInterval.reason === "break_started";

  return (
    <div className="fixed bottom-[5.5rem] right-[1.5rem] z-[95] w-[min(380px,calc(100%-2rem))] md:bottom-[1.5rem]">
      <Link
        href={`/goals/${goalId}/session/${sessionId}`}
        className="group relative block overflow-hidden rounded-[20px] border transition hover:-translate-y-0.5"
        style={{
          borderColor: `rgba(${aspectColorRgb}, 0.25)`,
          backgroundColor: `rgba(${aspectColorRgb}, 0.16)`,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
        }}
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="text-[30px] leading-none">{sessionEmoji}</span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold leading-tight text-black dark:text-white">
              {activityName}
            </p>
            <p className="mt-0.5 truncate text-[13px] font-medium text-black/50 dark:text-white/50">
              {goalTitle}
            </p>
          </div>

          {/* Stopwatch has no break countdown to hide behind — it just
              keeps showing the same frozen elapsed value the real timer
              page does. Timer mode's break countdown is local-only state
              on the timer page itself (see its own comment on
              breakSecondsLeft), which this pill doesn't replicate, so it
              hides the number rather than show a stale/misleading one. */}
          {(clockType === "stopwatch" || !isOnBreak) && (
            <span
              className="shrink-0 text-[17px] font-bold tabular-nums"
              style={{ color: aspectColor }}
            >
              {formatTime(seconds)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
