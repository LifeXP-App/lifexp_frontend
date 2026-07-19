import { internalMutation } from "./_generated/server";
import { recalculate } from "./sessions";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const ABANDON_PAUSED_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

export const cleanupStaleSessions = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // ── 1. Auto-pause live sessions with stale heartbeats ──
    // Mobile browsers suspend JS when the screen locks or the tab is
    // backgrounded, so heartbeats going silent usually means the user just
    // put their phone down — not that they abandoned the session. Pause
    // instead of killing it, backdating the pause to the last heartbeat so
    // the dead air counts as pause time (no focused time, no XP). When the
    // user comes back, the session is sitting there paused and resumable.
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
        status: "paused",
        lastHeartbeatAt: now,
        pauseIntervals: intervals,
        ...updates,
      });
    }

    // ── 2. Abandon sessions left paused for too long ──
    // Covers both user-paused sessions that were forgotten and sessions
    // auto-paused above whose owner never came back. lastHeartbeatAt is set
    // to the pause time by pauseSession and by the auto-pause above, so this
    // effectively measures time spent paused.
    const stalePaused = await ctx.db
      .query("sessions")
      .withIndex("by_heartbeat", (q) =>
        q
          .eq("status", "paused")
          .lt("lastHeartbeatAt", now - ABANDON_PAUSED_AFTER_MS)
      )
      .collect();

    for (const session of stalePaused) {
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

export const retryDjangoSync = internalMutation({
  handler: async (ctx) => {
    const unsynced = await ctx.db
      .query("sessions")
      .withIndex("by_sync", (q) => q.eq("syncedToDjango", false))
      .collect();

    const completed = unsynced.filter((s) => s.status === "completed");

    for (const session of completed) {
      // TODO: Implement HTTP action to PUT completed payload to Django
      // POST /api/v1/sessions/<session_id>/ with completion data
      // On success:
      //   await ctx.db.patch(session._id, {
      //     syncedToDjango: true,
      //     lastSyncedAt: Date.now(),
      //   });
      console.log(`[retryDjangoSync] Session ${session._id} needs sync to Django`);
    }
  },
});
