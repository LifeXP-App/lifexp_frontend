import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { xpRates } from "./schema";

// ── XP Calculation ──

type XpBreakdown = {
  physique: number;
  energy: number;
  logic: number;
  creativity: number;
  social: number;
};

type RateSegment = {
  atSecond: number;
  activityId: string;
  rates: XpBreakdown;
};

const DIMENSIONS = ["physique", "energy", "logic", "creativity", "social"] as const;

function calculateXP(
  rateSegments: RateSegment[],
  focusedDurationSeconds: number
): { total: number; breakdown: XpBreakdown } {
  const breakdown: XpBreakdown = {
    physique: 0,
    energy: 0,
    logic: 0,
    creativity: 0,
    social: 0,
  };

  for (let i = 0; i < rateSegments.length; i++) {
    const segment = rateSegments[i];
    if (segment.atSecond >= focusedDurationSeconds) break;

    const segmentEnd =
      i + 1 < rateSegments.length
        ? rateSegments[i + 1].atSecond
        : focusedDurationSeconds;

    const effectiveEnd = Math.min(segmentEnd, focusedDurationSeconds);
    const duration = effectiveEnd - segment.atSecond;

    for (const dim of DIMENSIONS) {
      breakdown[dim] += segment.rates[dim] * duration;
    }
  }

  const total = Math.floor(
    DIMENSIONS.reduce((sum, dim) => sum + breakdown[dim], 0)
  );

  return { total, breakdown };
}

// ── Pause Duration Helper ──

function getTotalPauseDurationMs(
  pauseIntervals: { pausedAt: number; resumedAt?: number }[],
  now: number
): number {
  let total = 0;
  for (const interval of pauseIntervals) {
    const end = interval.resumedAt ?? now;
    total += end - interval.pausedAt;
  }
  return total;
}

// ── Time & XP Recalculation Helper ──
// Also used by sessionJobs.ts (cron) so auto-pause/auto-abandon write the
// exact same totals a user-initiated pause/complete would.

export function recalculate(
  session: {
    startedAt: number;
    pauseIntervals: { pausedAt: number; resumedAt?: number }[];
    rateSegments: RateSegment[];
  },
  now: number
) {
  const totalDurationSeconds = (now - session.startedAt) / 1000;
  const pauseDurationSeconds =
    getTotalPauseDurationMs(session.pauseIntervals, now) / 1000;
  const focusedDurationSeconds = Math.max(
    0,
    totalDurationSeconds - pauseDurationSeconds
  );
  const { total: xpTotal, breakdown: xpBreakdown } = calculateXP(
    session.rateSegments,
    focusedDurationSeconds
  );

  return {
    totalDurationSeconds,
    focusedDurationSeconds,
    xpTotal,
    xpBreakdown,
  };
}

// ────────────────────────────────────────────
// MUTATIONS
// ────────────────────────────────────────────

export const startSession = mutation({
  args: {
  userId: v.string(),

  username: v.optional(v.string()),
  userFullname: v.optional(v.string()),
  userProfile: v.optional(v.string()),

  goalId: v.string(),
  goalTitle: v.optional(v.string()),

  activityId: v.string(),

  activityName: v.optional(v.string()),
  activityEmoji: v.optional(v.string()),
  activityType: v.optional(v.string()),

  activity_uid: v.optional(v.string()),

  rates: xpRates,

  deviceContext: v.optional(
    v.object({
      platform: v.union(
        v.literal("ios"),
        v.literal("android"),
        v.literal("web")
      ),
      appVersion: v.optional(v.string()),
      timezone: v.optional(v.string()),
      locale: v.optional(v.string()),
    })
  ),
},
  handler: async (ctx, args) => {
    // Check no existing active session for this user
    const existingLive = await ctx.db
      .query("sessions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "live")
      )
      .first();
    if (existingLive) {
      throw new Error("User already has a live session");
    }

    const existingAfk = await ctx.db
      .query("sessions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "afk")
      )
      .first();
    if (existingAfk) {
      throw new Error("User already has an afk session");
    }

    const existingPaused = await ctx.db
      .query("sessions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "paused")
      )
      .first();
    if (existingPaused) {
      throw new Error("User already has a paused session");
    }
const now = Date.now();

const sessionId = await ctx.db.insert("sessions", {
  userId: args.userId,
  username: args.username,
  userFullname: args.userFullname,
  userProfile: args.userProfile,

  goalId: args.goalId,
  goalTitle: args.goalTitle,

  activityId: args.activityId,
  activityName: args.activityName,
  activityEmoji: args.activityEmoji,
  activityType: args.activityType,

  activity_uid: args.activity_uid,

  status: "live",

  startedAt: now,
  lastResumedAt: now,
  lastHeartbeatAt: now,

  pauseIntervals: [],

  totalDurationSeconds: 0,
  focusedDurationSeconds: 0,

  sessionMode: "focus",
  focusPhaseStartSeconds: 0,
  focusAdjustSeconds: 0,
  clockType: "timer",

  rateSegments: [
    {
      atSecond: 0,
      activityId: args.activityId,
      rates: args.rates,
    },
  ],

  xpTotal: 0,

  xpBreakdown: {
    physique: 0,
    energy: 0,
    logic: 0,
    creativity: 0,
    social: 0,
  },

  nudgeCount: 0,

  syncedToDjango: false,

  deviceContext: args.deviceContext,
});
    return sessionId;
  },
});



export const heartbeat = mutation({
  args: {
    sessionId: v.id("sessions"),
    elapsedSeconds: v.number(),

    xpDelta: xpRates,
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "live") {
      throw new Error(`Cannot heartbeat a ${session.status} session`);
    }

    const now = Date.now();

   await ctx.db.patch(args.sessionId, {
  lastHeartbeatAt: now,

  totalDurationSeconds:
    session.totalDurationSeconds + args.elapsedSeconds,

  focusedDurationSeconds:
    session.focusedDurationSeconds + args.elapsedSeconds,

  xpTotal:
    session.xpTotal +
    args.xpDelta.physique +
    args.xpDelta.energy +
    args.xpDelta.logic +
    args.xpDelta.creativity +
    args.xpDelta.social,

  xpBreakdown: {
    physique:
      session.xpBreakdown.physique +
      args.xpDelta.physique,

    energy:
      session.xpBreakdown.energy +
      args.xpDelta.energy,

    logic:
      session.xpBreakdown.logic +
      args.xpDelta.logic,

    creativity:
      session.xpBreakdown.creativity +
      args.xpDelta.creativity,

    social:
      session.xpBreakdown.social +
      args.xpDelta.social,
  },
});
  },
});

export const pauseSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "live") {
      throw new Error(`Cannot pause a ${session.status} session`);
    }

    const now = Date.now();

    // Recalculate time/XP before pausing so totals are current
    const updates = recalculate(session, now);

    await ctx.db.patch(args.sessionId, {
      status: "paused",
      lastHeartbeatAt: now,
      ...updates,
      pauseIntervals: [
        ...session.pauseIntervals,
        { pausedAt: now, reason: args.reason },
      ],
    });
  },
});

export const enterAfk = mutation({
  args: {
    sessionId: v.id("sessions"),
    fromStatus: v.union(v.literal("live"), v.literal("paused")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status === "afk") return;
    if (session.status !== args.fromStatus) {
      throw new Error(`Cannot mark a ${session.status} session as afk from ${args.fromStatus}`);
    }

    const now = Date.now();
    const intervals = [...session.pauseIntervals];

    if (args.fromStatus === "live") {
      intervals.push({ pausedAt: now, reason: args.reason ?? "window_hidden" });
    }

    const updates = recalculate({ ...session, pauseIntervals: intervals }, now);

    await ctx.db.patch(args.sessionId, {
      status: "afk",
      lastHeartbeatAt: now,
      pauseIntervals: intervals,
      ...updates,
    });
  },
});

export const returnFromAfk = mutation({
  args: {
    sessionId: v.id("sessions"),
    toStatus: v.union(v.literal("live"), v.literal("paused")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "afk") return;

    const now = Date.now();
    const intervals = [...session.pauseIntervals];
    const lastInterval = intervals[intervals.length - 1];

    if (args.toStatus === "live" && lastInterval && lastInterval.resumedAt === undefined) {
      intervals[intervals.length - 1] = {
        ...lastInterval,
        resumedAt: now,
      };
    }

    await ctx.db.patch(args.sessionId, {
      status: args.toStatus,
      lastResumedAt: args.toStatus === "live" ? now : session.lastResumedAt,
      lastHeartbeatAt: now,
      pauseIntervals: intervals,
    });
  },
});

export const resumeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },

  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "paused" && session.status !== "afk") {
      throw new Error(`Cannot resume a ${session.status} session`);
    }

    const now = Date.now();

    const intervals = [...session.pauseIntervals];

    const lastInterval = intervals[intervals.length - 1];
    const wasOnBreak = lastInterval?.reason === "break_started";

    // only close interval if one exists
    if (lastInterval && !lastInterval.resumedAt) {
      intervals[intervals.length - 1] = {
        ...lastInterval,
        resumedAt: now,
      };
    }

    // At the end of a break, snapshot the session's cumulative focused time.
    // The client uses this as the zero point for the next 25-minute phase.
    const updates = recalculate({ ...session, pauseIntervals: intervals }, now);

    // Timer mode: each new focus phase after a break starts a fresh 25:00
    // countdown, so rebase to the current cumulative focus total. Stopwatch
    // mode has no phases to reset — resuming must continue the SAME stopwatch
    // value it was showing before the break, not restart it at 0, so leave
    // focusPhaseStartSeconds untouched.
    const rebaseForNewPhase = wasOnBreak && (session.clockType ?? "timer") === "timer";

    await ctx.db.patch(args.sessionId, {
      status: "live",
      lastResumedAt: now,
      lastHeartbeatAt: now,
      pauseIntervals: intervals,
      ...updates,
      ...(rebaseForNewPhase
        ? {
            focusPhaseStartSeconds: updates.focusedDurationSeconds,
            focusAdjustSeconds: 0,
          }
        : {}),
    });
  },
});

export const completeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    reason: v.union(
      v.literal("manual"),
      v.literal("auto"),
      v.literal("timeout")
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (
      session.status !== "live" &&
      session.status !== "afk" &&
      session.status !== "paused"
    ) {
      throw new Error(`Cannot complete a ${session.status} session`);
    }

    const now = Date.now();
    const intervals = [...session.pauseIntervals];

    // If paused/AFK, close the open inactive interval
    if (session.status === "paused" || session.status === "afk") {
      const lastInterval = intervals[intervals.length - 1];
      if (lastInterval && lastInterval.resumedAt === undefined) {
        intervals[intervals.length - 1] = { ...lastInterval, resumedAt: now };
      }
    }

    const sessionForCalc = { ...session, pauseIntervals: intervals };
    const updates = recalculate(sessionForCalc, now);

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      endedAt: now,
      completedReason: args.reason,
      pauseIntervals: intervals,
      ...updates,
    });

    return {
      endedAt: now,
      totalDurationSeconds: updates.totalDurationSeconds,
      focusedDurationSeconds: updates.focusedDurationSeconds,
      xpTotal: updates.xpTotal,
      xpBreakdown: updates.xpBreakdown,
    };
  },
});

export const abandonSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    interruptionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (
      session.status !== "live" &&
      session.status !== "afk" &&
      session.status !== "paused"
    ) {
      throw new Error(`Cannot abandon a ${session.status} session`);
    }

    const now = Date.now();
    const intervals = [...session.pauseIntervals];

    if (session.status === "paused" || session.status === "afk") {
      const lastInterval = intervals[intervals.length - 1];
      if (lastInterval && lastInterval.resumedAt === undefined) {
        intervals[intervals.length - 1] = { ...lastInterval, resumedAt: now };
      }
    }

    const sessionForCalc = { ...session, pauseIntervals: intervals };
    const updates = recalculate(sessionForCalc, now);

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      endedAt: now,
      completedReason: "abandoned",
      interruptionReason: args.interruptionReason,
      pauseIntervals: intervals,
      ...updates,
    });

    return {
      endedAt: now,
      totalDurationSeconds: updates.totalDurationSeconds,
      focusedDurationSeconds: updates.focusedDurationSeconds,
      xpTotal: updates.xpTotal,
      xpBreakdown: updates.xpBreakdown,
    };
  },
});

// QUERIES
// ────────────────────────────────────────────

export const getActiveSession = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const live = await ctx.db
      .query("sessions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "live")
      )
      .first();
    if (live) return live;

    const afk = await ctx.db
      .query("sessions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "afk")
      )
      .first();
    if (afk) return afk;

    return await ctx.db
      .query("sessions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "paused")
      )
      .first();
  },
});

export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const enterSessionAsSpectator = mutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.string(),
    username: v.string(),
    profilePicture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.userId === args.userId) return;

    const now = Date.now();
    const existing = session.spectators ?? [];
    const currentSpectator = existing.find(
      (spectator) => spectator.userId === args.userId,
    );
    const otherSpectators = existing.filter(
      (spectator) => spectator.userId !== args.userId,
    );

    // Spectator rows are permanent once created — anyone who has ever opened
    // this session stays in the list forever; only isWatching toggles based
    // on whether they're currently on the page.
    await ctx.db.patch(args.sessionId, {
      spectators: [
        ...otherSpectators,
        {
          userId: args.userId,
          username: args.username,
          profilePicture: args.profilePicture,
          isNudged: currentSpectator?.isNudged ?? false,
          isWatching: true,
          lastSeenAt: now,
        },
      ],
    });
  },
});

export const setSpectatorNudge = mutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.string(),
    isNudged: v.boolean(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, {
      spectators: (session.spectators ?? []).map((spectator) =>
        spectator.userId === args.userId
          ? { ...spectator, isNudged: args.isNudged }
          : spectator,
      ),
    });
  },
});

export const leaveSessionAsSpectator = mutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;
    // Never remove the spectator row — just mark them as no longer watching.
    await ctx.db.patch(args.sessionId, {
      spectators: (session.spectators ?? []).map((spectator) =>
        spectator.userId === args.userId
          ? { ...spectator, isWatching: false, lastSeenAt: Date.now() }
          : spectator,
      ),
    });
  },
});

export const getSessionsByGoal = query({
  args: { goalId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .order("desc")
      .collect();
    return sessions.filter((session) => session.status === "completed");
  },
});

export const updateInitialRates = mutation({
  args: {
    sessionId: v.id("sessions"),
    rates: v.optional(xpRates),
    activityId: v.optional(v.string()),
    activity_uid: v.optional(v.string()),
    activityName: v.optional(v.string()),
    activityEmoji: v.optional(v.string()),
    activityType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const updatedSegments = session.rateSegments.map((seg, i) => {
      if (i !== 0) return seg;
      return {
        ...seg,
        activityId: args.activityId ?? seg.activityId,
        rates: args.rates ?? seg.rates,
      };
    });

    await ctx.db.patch(args.sessionId, {
      activityId: args.activityId ?? session.activityId,
      activity_uid: args.activity_uid ?? session.activity_uid,
      activityName: args.activityName ?? session.activityName,
      activityEmoji: args.activityEmoji ?? session.activityEmoji,
      activityType: args.activityType ?? session.activityType,
      rateSegments: updatedSegments,
    });
  },
});

export const adjustFocusTime = mutation({
  args: {
    sessionId: v.id("sessions"),
    deltaSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, {
      focusAdjustSeconds: (session.focusAdjustSeconds ?? 0) + args.deltaSeconds,
    });
  },
});

export const setClockType = mutation({
  args: {
    sessionId: v.id("sessions"),
    clockType: v.union(v.literal("timer"), v.literal("stopwatch")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    // Switching to stopwatch mode changes only how the clock is displayed
    // (counting up from the session's focused time instead of counting down
    // from 25:00) -- focusedDurationSeconds already IS that value, so no
    // other field needs to change. Any leftover +60/-60 adjustment from timer
    // mode no longer applies once the clock is a stopwatch.
    //
    // Switching to timer mode always starts a fresh 25:00 rather than
    // resuming wherever the stopwatch left off -- rebase focusPhaseStartSeconds
    // to the session's current cumulative focused time (same baseline reset
    // resumeSession does when a break ends into a new focus phase) and clear
    // any stale adjustment.
    const now = Date.now();
    const updates = recalculate(session, now);

    await ctx.db.patch(args.sessionId, {
      clockType: args.clockType,
      focusAdjustSeconds: 0,
      ...(args.clockType === "timer"
        ? { focusPhaseStartSeconds: updates.focusedDurationSeconds }
        : {}),
    });
  },
});

export const deleteSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;
    await ctx.db.delete(args.sessionId);
  },
});

export const markSyncedToDjango = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      syncedToDjango: true,
      lastSyncedAt: Date.now(),
    });
  },
});


export const getLiveSessions = query({
  args: {},
  handler: async (ctx) => {
    const [live, afk, paused] = await Promise.all([
      ctx.db
        .query("sessions")
        .withIndex("by_heartbeat", (q) => q.eq("status", "live"))
        .order("desc")
        .collect(),
      ctx.db
        .query("sessions")
        .withIndex("by_heartbeat", (q) => q.eq("status", "afk"))
        .order("desc")
        .collect(),
      ctx.db
        .query("sessions")
        .withIndex("by_heartbeat", (q) => q.eq("status", "paused"))
        .order("desc")
        .collect(),
    ]);
    // A pomodoro break pauses the session with reason "break_started" — surface
    // that as its own display state so the UI can distinguish break from a
    // manual pause.
    return [...live, ...afk, ...paused].map((s) => {
      const openInterval = s.pauseIntervals[s.pauseIntervals.length - 1];
      const onBreak =
        s.status === "paused" &&
        openInterval !== undefined &&
        openInterval.resumedAt === undefined &&
        openInterval.reason === "break_started";
      return { ...s, onBreak };
    });
  },
});

export const getLiveSessionsForActivity = query({
  args: {
    activityId: v.string(),
  },

  handler: async (ctx, args) => {
    const [live, afk, paused] = await Promise.all([
      ctx.db
        .query("sessions")
        .withIndex("by_activity_status", (q) =>
          q.eq("activityId", args.activityId).eq("status", "live")
        )
        .collect(),
      ctx.db
        .query("sessions")
        .withIndex("by_activity_status", (q) =>
          q.eq("activityId", args.activityId).eq("status", "afk")
        )
        .collect(),
      ctx.db
        .query("sessions")
        .withIndex("by_activity_status", (q) =>
          q.eq("activityId", args.activityId).eq("status", "paused")
        )
        .collect(),
    ]);
    return [...live, ...afk, ...paused];
  },
});
