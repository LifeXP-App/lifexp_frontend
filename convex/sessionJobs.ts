import { internalMutation } from "./_generated/server";
import { recalculate } from "./sessions";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const ABANDON_PAUSED_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

export const cleanupStaleSessions = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // ── 1. Mark live sessions AFK when heartbeats go stale ──
    // Mobile browsers suspend JS when the screen locks or the tab is
    // backgrounded, so heartbeats going silent usually means the user just
    // put their phone down — not that they abandoned the session. Mark AFK
    // instead of killing it, backdating the pause to the last heartbeat so
    // the dead air counts as pause time (no focused time, no XP). When the
    // user comes back, the session can return to live or paused locally.
    const staleLive = await ctx.db
      .query("sessions")
      .withIndex("by_heartbeat", (q) =>
        q.eq("status", "live").lt("lastHeartbeatAt", now - STALE_THRESHOLD_MS)
      )
      .collect();

    for (const session of staleLive) {
      const intervals = [
        ...session.pauseIntervals,
        { pausedAt: session.lastHeartbeatAt, reason: "heartbeat_timeout" },
      ];
      const updates = recalculate({ ...session, pauseIntervals: intervals }, now);

      await ctx.db.patch(session._id, {
        status: "afk",
        lastHeartbeatAt: now,
        pauseIntervals: intervals,
        ...updates,
      });
    }

    // ── 2. Abandon sessions left inactive for too long ──
    // Covers both user-paused and AFK sessions whose owner never came back.
    const [stalePaused, staleAfk] = await Promise.all([
      ctx.db
        .query("sessions")
        .withIndex("by_heartbeat", (q) =>
          q
            .eq("status", "paused")
            .lt("lastHeartbeatAt", now - ABANDON_PAUSED_AFTER_MS)
        )
        .collect(),
      ctx.db
        .query("sessions")
        .withIndex("by_heartbeat", (q) =>
          q
            .eq("status", "afk")
            .lt("lastHeartbeatAt", now - ABANDON_PAUSED_AFTER_MS)
        )
        .collect(),
    ]);

    for (const session of [...stalePaused, ...staleAfk]) {
      const intervals = [...session.pauseIntervals];
      const lastInterval = intervals[intervals.length - 1];
      if (lastInterval && lastInterval.resumedAt === undefined) {
        intervals[intervals.length - 1] = { ...lastInterval, resumedAt: now };
      }

      const updates = recalculate({ ...session, pauseIntervals: intervals }, now);

      await ctx.db.patch(session._id, {
        status: "completed",
        endedAt: now,
        completedReason: "abandoned",
        interruptionReason: "pause_timeout",
        pauseIntervals: intervals,
        ...updates,
      });
    }
  },
});

