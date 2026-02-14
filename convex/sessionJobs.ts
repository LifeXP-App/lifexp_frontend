import { internalMutation } from "./_generated/server";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const cleanupStaleSessions = internalMutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - STALE_THRESHOLD_MS;

    // Find live sessions with stale heartbeats
    const staleSessions = await ctx.db
      .query("sessions")
      .withIndex("by_heartbeat", (q) =>
        q.eq("status", "live").lt("lastHeartbeatAt", cutoff)
      )
      .collect();

    for (const session of staleSessions) {
      const now = Date.now();
      const intervals = [...session.pauseIntervals];

      // Close any open pause interval
      const lastInterval = intervals[intervals.length - 1];
      if (lastInterval && lastInterval.resumedAt === undefined) {
        intervals[intervals.length - 1] = { ...lastInterval, resumedAt: now };
      }

      const totalDurationSeconds = (now - session.startedAt) / 1000;
      let pauseDurationMs = 0;
      for (const interval of intervals) {
        pauseDurationMs += (interval.resumedAt ?? now) - interval.pausedAt;
      }
      const focusedDurationSeconds = Math.max(
        0,
        totalDurationSeconds - pauseDurationMs / 1000
      );

      // Recalculate XP
      const breakdown = { physique: 0, energy: 0, logic: 0, creativity: 0, social: 0 };
      for (let i = 0; i < session.rateSegments.length; i++) {
        const segment = session.rateSegments[i];
        if (segment.atSecond >= focusedDurationSeconds) break;
        const segmentEnd =
          i + 1 < session.rateSegments.length
            ? session.rateSegments[i + 1].atSecond
            : focusedDurationSeconds;
        const effectiveEnd = Math.min(segmentEnd, focusedDurationSeconds);
        const duration = effectiveEnd - segment.atSecond;
        for (const dim of ["physique", "energy", "logic", "creativity", "social"] as const) {
          breakdown[dim] += segment.rates[dim] * duration;
        }
      }
      const xpTotal = Math.floor(
        Object.values(breakdown).reduce((a, b) => a + b, 0)
      );

      await ctx.db.patch(session._id, {
        status: "completed",
        endedAt: now,
        completedReason: "abandoned",
        interruptionReason: "heartbeat_timeout",
        pauseIntervals: intervals,
        totalDurationSeconds,
        focusedDurationSeconds,
        xpTotal,
        xpBreakdown: breakdown,
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
