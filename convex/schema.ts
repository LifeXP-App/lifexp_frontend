import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const xpRates = v.object({
  physique: v.number(),
  energy: v.number(),
  logic: v.number(),
  creativity: v.number(),
  social: v.number(),
});

export default defineSchema({
  sessions: defineTable({
    // ── Ownership ──
    userId: v.string(), // Django user UUID
    goalId: v.string(), // Django goal UUID
    activityId: v.string(), // primary activity UUID (denormalized from rateSegments[0])

    // ── Lifecycle ──
    status: v.union(
      v.literal("live"),
      v.literal("paused"),
      v.literal("completed")
    ),
    startedAt: v.number(), // epoch ms
    endedAt: v.optional(v.number()),
    lastResumedAt: v.optional(v.number()),

    // ── Heartbeat ──
    lastHeartbeatAt: v.number(),

    // ── Pause Tracking ──
    pauseIntervals: v.array(
      v.object({
        pausedAt: v.number(),
        resumedAt: v.optional(v.number()),
        reason: v.optional(v.string()),
      })
    ),

    // ── Time Tracking ──
    totalDurationSeconds: v.number(),
    focusedDurationSeconds: v.number(),

    // ── XP Rates ──
    rateSegments: v.array(
      v.object({
        atSecond: v.number(),
        activityId: v.string(),
        rates: xpRates,
      })
    ),

    // ── XP Totals ──
    xpTotal: v.number(),
    xpBreakdown: xpRates,

    // ── Social ──
    nudgeCount: v.number(),

    // ── Device Context ──
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

    // ── Completion Metadata ──
    completedReason: v.optional(
      v.union(
        v.literal("manual"),
        v.literal("auto"),
        v.literal("abandoned"),
        v.literal("timeout"),
        v.literal("crash_recovered")
      )
    ),
    interruptionReason: v.optional(v.string()),

    // ── Django Sync ──
    syncedToDjango: v.boolean(),
    lastSyncedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_goal", ["goalId"])
    .index("by_sync", ["syncedToDjango"])
    .index("by_heartbeat", ["status", "lastHeartbeatAt"]),
});
