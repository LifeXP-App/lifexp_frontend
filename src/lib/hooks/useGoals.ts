import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GoalsService, Session } from "../services/goals";
import { useConvexSessionsByGoal } from "./useConvexSessions";

export function useGoal(goalId: string) {
  const queryClient = useQueryClient();

  // React Query's `isLoading` (no cached data yet + fetching) vs `isFetching`
  // (any fetch in flight, including background revalidation) is exactly the
  // distinction we need: a genuinely new goalId blocks on the skeleton, but a
  // manual `refetch()` after e.g. deleting a session — where we already have
  // data — updates quietly without flashing the loading state again.
  const {
    data: goal = null,
    isLoading: goalLoading,
    error: goalQueryError,
  } = useQuery({
    queryKey: ["goal", goalId],
    queryFn: () => GoalsService.getGoal(goalId),
    enabled: !!goalId,
  });

  const { data: sessionsResponse } = useQuery({
    queryKey: ["goal", goalId, "sessions"],
    queryFn: () => GoalsService.getGoalSessions(goalId).catch(() => null),
    enabled: !!goalId,
  });
  const djangoSessions = useMemo(
    () => sessionsResponse?.results ?? [],
    [sessionsResponse],
  );

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
    const djangoById = new Map(djangoSessions.map((s) => [s.id, s]));
    const convexIds = new Set(convexMapped.map((s) => s.id));
    const historicalOnly = djangoSessions.filter((s) => !convexIds.has(s.id));

    // Convex has no completionPicture writer anywhere (it's uploaded via the
    // reflection page straight to Django/Cloudinary), so convexMapped's copy
    // is always null. Without this, "Convex wins" would clobber a real
    // completion picture Django already has with null on every render.
    const convexWithPictures = convexMapped.map((s) =>
      s.completion_picture
        ? s
        : { ...s, completion_picture: djangoById.get(s.id)?.completion_picture ?? null },
    );

    return [...convexWithPictures, ...historicalOnly].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }, [convexMapped, djangoSessions]);

  const refetch = useCallback(() => {
    // Partial key match invalidates both ["goal", goalId] and
    // ["goal", goalId, "sessions"] in one call.
    queryClient.invalidateQueries({ queryKey: ["goal", goalId] });
  }, [queryClient, goalId]);

  const isLoading = goalLoading || (sessionsLoading && sessions.length === 0);

  const error = goalQueryError
    ? goalQueryError instanceof Error
      ? goalQueryError.message
      : "Failed to fetch goal data"
    : null;

  return {
    goal,
    sessions,
    loading: isLoading,
    error,
    refetch,
  };
}
