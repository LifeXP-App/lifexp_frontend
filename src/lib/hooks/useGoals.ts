import { useCallback, useEffect, useState, useMemo } from "react";
import { Goal, GoalsService, Session } from "../services/goals";
import { useConvexSessionsByGoal } from "./useConvexSessions";

export function useGoal(goalId: string) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [djangoSessions, setDjangoSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time sessions from Convex (live + recently completed)
  const { sessions: convexSessions, loading: sessionsLoading } = useConvexSessionsByGoal(goalId);

  // Transform Convex sessions to match the Session interface
  const convexMapped = useMemo<Session[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Merge: Convex wins for sessions in both (has live state); Django fills in historical ones
  const sessions = useMemo<Session[]>(() => {
    const convexIds = new Set(convexMapped.map((s) => s.id));
    const historicalOnly = djangoSessions.filter((s) => !convexIds.has(s.id));
    return [...convexMapped, ...historicalOnly].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }, [convexMapped, djangoSessions]);

  const fetchGoalData = useCallback(async () => {
    if (!goalId) return;

    setLoading(true);
    setError(null);

    try {
      const [goalData, sessionData] = await Promise.all([
        GoalsService.getGoal(goalId),
        GoalsService.getGoalSessions(goalId).catch(() => null),
      ]);
      setGoal(goalData);
      if (sessionData?.results) {
        setDjangoSessions(sessionData.results);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch goal data",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchGoalData();
  }, [fetchGoalData]);

  const isLoading = loading || (sessionsLoading && sessions.length === 0);

  return {
    goal,
    sessions,
    loading: isLoading,
    error,
    refetch: fetchGoalData,
  };
}
