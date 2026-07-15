import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";

/**
 * Hook to fetch real-time sessions for a goal from Convex
 * Returns both live and completed sessions with real-time updates
 */
export function useConvexSessionsByGoal(goalId: string | null) {
  const sessions = useQuery(
    api.sessions.getSessionsByGoal,
    goalId ? { goalId } : "skip"
  );

  return {
    sessions: sessions ?? [],
    loading: sessions === undefined,
  };
}

/**
 * Hook to fetch active session for a user from Convex
 * Returns null if no active session (live or paused)
 */
export function useConvexActiveSession(userId: string | null) {
  const session = useQuery(
    api.sessions.getActiveSession,
    userId ? { userId } : "skip"
  );

  return {
    session: session ?? null,
    loading: session === undefined,
    hasActiveSession: session !== null && session !== undefined,
  };
}

/**
 * Hook to fetch a specific session by ID from Convex
 */
export function useConvexSession(sessionId: Id<"sessions"> | null) {
  const session = useQuery(
    api.sessions.getSession,
    sessionId ? { sessionId } : "skip"
  );

  return {
    session: session ?? null,
    loading: session === undefined,
  };
}

/**
 * Transform Convex session to match the Django Session interface
 * This maintains backward compatibility with existing components
 */
export function transformConvexSession(convexSession: Doc<"sessions"> | null | undefined) {
  if (!convexSession) return null;

  return {
    id: convexSession._id,
    completion_picture: null, // TODO: Add this to Convex schema if needed
    started_at: new Date(convexSession.startedAt).toISOString(),
    ended_at: convexSession.endedAt
      ? new Date(convexSession.endedAt).toISOString()
      : null,
    total_duration_seconds: convexSession.totalDurationSeconds,
    focused_duration_seconds: convexSession.focusedDurationSeconds,
    xp_total: convexSession.xpTotal,
    xp_physique: convexSession.xpBreakdown.physique,
    xp_energy: convexSession.xpBreakdown.energy,
    xp_logic: convexSession.xpBreakdown.logic,
    xp_creativity: convexSession.xpBreakdown.creativity,
    xp_social: convexSession.xpBreakdown.social,
    completed_reason: convexSession.completedReason ?? null,
    activity: {
      id: convexSession.activityId,
      name: "Activity", // TODO: Fetch from Django or denormalize
      emoji: "🎯", // TODO: Fetch from Django or denormalize
      type: "logic", // TODO: Fetch from Django or denormalize
    },
  };
}
