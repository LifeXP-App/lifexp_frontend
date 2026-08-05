"use client";

import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import { useConvexActiveSession } from "@/src/lib/hooks/useConvexSessions";
import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";

export default function AfkSessionPopup() {
  const { me } = useAuth();
  const userId = me ? String(me.id) : null;
  const { session } = useConvexActiveSession(userId);

  if (!session || session.status !== "afk") {
    return null;
  }

  const sessionId = session._id;
  const goalId = session.goalId;
  const sessionEmoji = session.activityEmoji || "⌛";
  const activityMeta = session.activityType
    ? ACTIVITY_META[session.activityType as ActivityType]
    : undefined;
  const activityColor = activityMeta?.cssColorVar;
  const activityColorRgb = activityMeta?.cssColorVarRgb;
  const goalTitle = session.goalTitle || session.activityName || "Ongoing session";

  if (!sessionId || !goalId) return null;

  return (
    <div className="fixed bottom-[1.5rem] right-[1.5rem] z-[95] w-[min(340px,calc(100%-2rem))]">
      <Link
        href={`/goals/${goalId}/session/${sessionId}`}
        className="group relative block rounded-3xl border border-gray-200 bg-white/90 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.38)] transition hover:-translate-y-0.25 hover:shadow-[0_32px_90px_rgba(0,0,0,0.4)] dark:border-[var(--border)] dark:bg-dark-2/90 backdrop-blur-sm"
      >
        <span
          className="pointer-events-none absolute top-4 right-4 h-2 w-2 rounded-full animate-pulse"
          style={{
            backgroundColor: activityColor ?? "#38bdf8",
            boxShadow: activityColorRgb
              ? `0 0 0 2px rgba(${activityColorRgb}, 0.16)`
              : "0 0 0 3px rgba(15,23,42,0.12)",
          }}
        />

        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-10 w-10 flex-shrink-0 rounded-lg bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 flex items-center justify-center text-lg font-semibold">
            {sessionEmoji}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/50 dark:text-[var(--foreground)]/60">
              Ongoing session
            </p>
            <h2 className="mt-1 text-sm font-semibold text-black dark:text-[var(--foreground)] truncate">
              {goalTitle}
            </h2>
            <p className="mt-2 text-sm text-black/60 dark:text-[var(--foreground)]/70">
              Your session was marked AFK. Tap to return to your timer.
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
