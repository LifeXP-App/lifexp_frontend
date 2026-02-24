export interface Goal {
  id: string;
  title: string;
  emoji: string;
  category: {
    name: string;
    color: string;
  } | null;
  status: "active" | "completed" | "paused" | "abandoned";
  days_total: number;
  days_completed: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_duration_seconds: number | null;
  focused_duration_seconds: number | null;
  xp_total: number;
  xp_physique: number;
  xp_energy: number;
  xp_logic: number;
  xp_creativity: number;
  xp_social: number;
  completed_reason: string | null;
  activity: {
    id: string;
    name: string;
    emoji: string;
  } | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const GoalsService = {
  async getGoals(status?: string): Promise<PaginatedResponse<Goal>> {
    const query = status ? `?status=${status}` : "";
    const res = await fetch(`/api/goals${query}`);
    if (!res.ok) throw new Error("Failed to fetch goals");
    return res.json();
  },

  async getGoal(id: string): Promise<Goal> {
    const res = await fetch(`/api/goals/${id}`);
    if (!res.ok) throw new Error("Failed to fetch goal");
    return res.json();
  },

  async getGoalSessions(id: string): Promise<PaginatedResponse<Session>> {
    const res = await fetch(`/api/goals/${id}/sessions`);
    if (!res.ok) throw new Error("Failed to fetch goal sessions");
    return res.json();
  },

  async createGoal(data: Partial<Goal>): Promise<Goal> {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create goal");
    return res.json();
  },

  async deleteGoal(id: string): Promise<void> {
    const res = await fetch(`/api/goals/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete goal");
  },
};
