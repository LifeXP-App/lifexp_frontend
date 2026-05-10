import { useCallback, useEffect, useState, useMemo } from "react";
import { Goal, GoalsService, Session } from "../services/goals";
import { useConvexSessionsByGoal } from "./useConvexSessions";

/**
 * Hybrid hook that fetches:
 * - Goal data from Django (metadata, status, etc.)
 * - Session data from Convex (real-time, live + completed)
 *
 * This provides real-time session updates while keeping goal data in Django
 */
export function useGoal(goalId: string) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions from Convex in real-time
  const { sessions: convexSessions, loading: sessionsLoading } = useConvexSessionsByGoal(goalId);

  // Transform Convex sessions to match Django Session interface
  const sessions = useMemo<Session[]>(() => {
    return convexSessions.map((convexSession: any) => ({
      id: convexSession._id,
      completion_picture: convexSession.completionPicture ?? null,
      started_at: new Date(convexSession.startedAt).toISOString(),
      ended_at: convexSession.endedAt
        ? new Date(convexSession.endedAt).toISOString()
        : null,
      total_duration_seconds: Math.floor(convexSession.totalDurationSeconds),
      focused_duration_seconds: Math.floor(convexSession.focusedDurationSeconds),
      xp_total: convexSession.xpTotal,
      xp_physique: Math.floor(convexSession.xpBreakdown.physique),
      xp_energy: Math.floor(convexSession.xpBreakdown.energy),
      xp_logic: Math.floor(convexSession.xpBreakdown.logic),
      xp_creativity: Math.floor(convexSession.xpBreakdown.creativity),
      xp_social: Math.floor(convexSession.xpBreakdown.social),
      completed_reason: convexSession.completedReason ?? null,
      activity: {
        id: convexSession.activityId,
        name: convexSession.activityName ?? "Activity",
        emoji: convexSession.activityEmoji ?? "🎯",
        type: convexSession.activityType ?? "logic",
      },
    }));
  }, [convexSessions]);

  const fetchGoalData = useCallback(async () => {
    if (!goalId) return;

    setLoading(true);
    setError(null);
    if (process.env.NODE_ENV !== "production") {
      console.log("[useGoal] fetchGoalData:start", { goalId });
    }

    try {
      const goalData = await GoalsService.getGoal(goalId);
      setGoal(goalData);
      if (process.env.NODE_ENV !== "production") {
        console.log("[useGoal] goalData", goalData);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch goal data",
      );
      console.error(err);
    } finally {
      if (process.env.NODE_ENV !== "production") {
        console.log("[useGoal] fetchGoalData:end", { goalId });
      }
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchGoalData();
  }, [fetchGoalData]);

  // Combined loading state: goal must be loaded, sessions can stream in
  const isLoading = loading || (sessionsLoading && sessions.length === 0);

  return {
    goal,
    sessions,
    loading: isLoading,
    error,
    refetch: fetchGoalData
  };
}
