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

function recalculate(
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
    goalId: v.string(),
    activityId: v.string(),
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
    // Check no existing live or paused session for this user
    const existingLive = await ctx.db
      .query("sessions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "live")
      )
      .first();
    if (existingLive) {
      throw new Error("User already has a live session");
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
      goalId: args.goalId,
      activityId: args.activityId,
      status: "live",
      startedAt: now,
      lastHeartbeatAt: now,
      pauseIntervals: [],
      totalDurationSeconds: 0,
      focusedDurationSeconds: 0,
      rateSegments: [{ atSecond: 0, activityId: args.activityId, rates: args.rates }],
      xpTotal: 0,
      xpBreakdown: { physique: 0, energy: 0, logic: 0, creativity: 0, social: 0 },
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
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "live") {
      throw new Error(`Cannot heartbeat a ${session.status} session`);
    }

    const now = Date.now();
    const updates = recalculate(session, now);

    await ctx.db.patch(args.sessionId, {
      lastHeartbeatAt: now,
      ...updates,
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

export const resumeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "paused") {
      throw new Error(`Cannot resume a ${session.status} session`);
    }

    const now = Date.now();
    const intervals = [...session.pauseIntervals];
    const lastInterval = intervals[intervals.length - 1];
    if (!lastInterval || lastInterval.resumedAt !== undefined) {
      throw new Error("No open pause interval to resume");
    }

    // Close the open pause interval
    intervals[intervals.length - 1] = { ...lastInterval, resumedAt: now };

    await ctx.db.patch(args.sessionId, {
      status: "live",
      lastResumedAt: now,
      lastHeartbeatAt: now,
      pauseIntervals: intervals,
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
    if (session.status !== "live" && session.status !== "paused") {
      throw new Error(`Cannot complete a ${session.status} session`);
    }

    const now = Date.now();
    const intervals = [...session.pauseIntervals];

    // If paused, close the open pause interval
    if (session.status === "paused") {
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
    if (session.status !== "live" && session.status !== "paused") {
      throw new Error(`Cannot abandon a ${session.status} session`);
    }

    const now = Date.now();
    const intervals = [...session.pauseIntervals];

    if (session.status === "paused") {
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
  },
});

// ────────────────────────────────────────────
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

export const getSessionsByGoal = query({
  args: { goalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .order("desc")
      .collect();
  },
});
