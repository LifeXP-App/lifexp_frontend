import { useCallback, useEffect, useState } from "react";
import { Goal, GoalsService, Session } from "../services/goals";

export function useGoal(goalId: string) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!goalId) return;

    setLoading(true);
    setError(null);
    if (process.env.NODE_ENV !== "production") {
      console.log("[useGoal] fetchData:start", { goalId });
    }

    try {
      const goalData = await GoalsService.getGoal(goalId);
      setGoal(goalData);
      if (process.env.NODE_ENV !== "production") {
        console.log("[useGoal] goalData", goalData);
      }

      try {
        const sessionsData = await GoalsService.getGoalSessions(goalId);
        if (process.env.NODE_ENV !== "production") {
          console.log("[useGoal] sessionsData", sessionsData);
        }
        setSessions(
          Array.isArray(sessionsData.results) ? sessionsData.results : [],
        );
      } catch (sessionsErr) {
        console.warn(
          "Failed to fetch goal sessions, showing goal details without sessions",
          sessionsErr,
        );
        setSessions([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch goal data",
      );
      console.error(err);
    } finally {
      if (process.env.NODE_ENV !== "production") {
        console.log("[useGoal] fetchData:end", { goalId });
      }
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { goal, sessions, loading, error, refetch: fetchData };
}
