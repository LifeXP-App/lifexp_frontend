import { useState, useEffect, useCallback } from 'react';
import { GoalsService, Goal, Session } from '../services/goals';

export function useGoal(goalId: string) {
    const [goal, setGoal] = useState<Goal | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!goalId) return;

        setLoading(true);
        setError(null);

        try {
            const [goalData, sessionsData] = await Promise.all([
                GoalsService.getGoal(goalId),
                GoalsService.getGoalSessions(goalId)
            ]);

            setGoal(goalData);
            setSessions(sessionsData.results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch goal data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [goalId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { goal, sessions, loading, error, refetch: fetchData };
}
