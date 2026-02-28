export interface Goal {
  id: string;
  title: string;
  emoji: string;
  description: string | null;
  finish_by: string | null;
  category: {
    name: string;
    color: string;
  } | null;
  status:
    | "active"
    | "ongoing"
    | "planned"
    | "completed"
    | "paused"
    | "abandoned";
  days_total: number;
  days_completed: number;
  total_xp?: number;
  xp_distribution?: {
    physique?: number;
    energy?: number;
    logic?: number;
    creativity?: number;
    social?: number;
  } | null;
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

export type GoalStatus = Goal["status"];

export interface CreateGoalPayload {
  title: string;
  description?: string;
  emoji?: string;
  activity?: number;
  days_total?: number;
  target_date?: string;
  finish_by?: string;
}

export interface GoalsQueryOptions {
  status?: GoalStatus;
  page?: number;
  page_size?: number;
}

export interface GoalSessionsQueryOptions {
  page?: number;
  page_size?: number;
}

const GOALS_DEBUG = process.env.NODE_ENV !== "production";

function goalsDebugLog(label: string, payload?: unknown) {
  if (!GOALS_DEBUG) return;
  if (payload === undefined) {
    console.log(`[GoalsService] ${label}`);
    return;
  }
  console.log(`[GoalsService] ${label}`, payload);
}

function normalizeGoalStatus(status: unknown): GoalStatus {
  if (status === "active") return "active";
  if (status === "ongoing") return "ongoing";
  if (status === "planned") return "planned";
  if (status === "completed") return "completed";
  if (status === "paused") return "paused";
  if (status === "abandoned") return "abandoned";
  return "planned";
}

function normalizeGoal(item: unknown): Goal | null {
  if (!item || typeof item !== "object") return null;
  const goal = item as Record<string, unknown>;

  const rawId = goal.id;
  if (typeof rawId !== "string" && typeof rawId !== "number") return null;

  const title =
    typeof goal.title === "string" && goal.title.trim().length > 0
      ? goal.title
      : typeof goal.content === "string" && goal.content.trim().length > 0
        ? goal.content
        : "Untitled Goal";

  const category =
    goal.category && typeof goal.category === "object"
      ? (goal.category as Record<string, unknown>)
      : null;

  const xpDistribution =
    goal.xp_distribution && typeof goal.xp_distribution === "object"
      ? (goal.xp_distribution as Record<string, unknown>)
      : null;

  return {
    id: String(rawId),
    title,
    emoji: typeof goal.emoji === "string" ? goal.emoji : "🎯",
    description:
      typeof goal.description === "string"
        ? goal.description
        : typeof goal.content === "string"
          ? goal.content
          : null,
    finish_by: typeof goal.finish_by === "string" ? goal.finish_by : null,
    category:
      category &&
      typeof category.name === "string" &&
      typeof category.color === "string"
        ? {
            name: category.name,
            color: category.color,
          }
        : null,
    status: normalizeGoalStatus(goal.status),
    days_total: typeof goal.days_total === "number" ? goal.days_total : 0,
    days_completed:
      typeof goal.days_completed === "number" ? goal.days_completed : 0,
    total_xp: typeof goal.total_xp === "number" ? goal.total_xp : undefined,
    xp_distribution: xpDistribution
      ? {
          physique:
            typeof xpDistribution.physique === "number"
              ? xpDistribution.physique
              : 0,
          energy:
            typeof xpDistribution.energy === "number"
              ? xpDistribution.energy
              : 0,
          logic:
            typeof xpDistribution.logic === "number" ? xpDistribution.logic : 0,
          creativity:
            typeof xpDistribution.creativity === "number"
              ? xpDistribution.creativity
              : 0,
          social:
            typeof xpDistribution.social === "number"
              ? xpDistribution.social
              : 0,
        }
      : null,
    created_at:
      typeof goal.created_at === "string"
        ? goal.created_at
        : new Date().toISOString(),
    updated_at:
      typeof goal.updated_at === "string"
        ? goal.updated_at
        : new Date().toISOString(),
  };
}

export const GoalsService = {
  async getGoals(
    options?: GoalsQueryOptions,
  ): Promise<PaginatedResponse<Goal>> {
    const params = new URLSearchParams();

    if (options?.status) {
      params.set("status", options.status);
    }
    if (typeof options?.page === "number") {
      params.set("page", String(options.page));
    }
    if (typeof options?.page_size === "number") {
      params.set("page_size", String(options.page_size));
    }

    const query = params.toString();
    const res = await fetch(`/api/goals${query ? `?${query}` : ""}`);
    if (!res.ok) throw new Error("Failed to fetch goals");

    const data = await res.json();

    const normalizeGoals = (items: unknown[]): Goal[] => {
      return items
        .map((item) => normalizeGoal(item))
        .filter((item): item is Goal => item !== null);
    };

    const goals = Array.isArray(data)
      ? normalizeGoals(data)
      : data && typeof data === "object" && "results" in data
        ? normalizeGoals((data as { results?: unknown[] }).results ?? [])
        : data && typeof data === "object" && "data" in data
          ? normalizeGoals((data as { data?: unknown[] }).data ?? [])
          : data && typeof data === "object" && "items" in data
            ? normalizeGoals((data as { items?: unknown[] }).items ?? [])
            : [];

    return {
      count:
        data &&
        typeof data === "object" &&
        typeof (data as { count?: unknown }).count === "number"
          ? (data as { count: number }).count
          : goals.length,
      next:
        data && typeof data === "object" && "next" in data
          ? ((data as { next?: string | null }).next ?? null)
          : null,
      previous:
        data && typeof data === "object" && "previous" in data
          ? ((data as { previous?: string | null }).previous ?? null)
          : null,
      results: goals,
    };
  },

  async getGoal(id: string): Promise<Goal> {
    goalsDebugLog("getGoal:request", { id, url: `/api/goals/${id}` });
    const res = await fetch(`/api/goals/${id}`);
    goalsDebugLog("getGoal:responseStatus", { id, status: res.status });
    if (!res.ok) throw new Error("Failed to fetch goal");
    const data = await res.json();
    goalsDebugLog("getGoal:rawPayload", data);
    const normalized = normalizeGoal(data);
    goalsDebugLog("getGoal:normalized", normalized);
    if (!normalized) throw new Error("Invalid goal payload");
    return normalized;
  },

  async getGoalSessions(
    id: string,
    options?: GoalSessionsQueryOptions,
  ): Promise<PaginatedResponse<Session>> {
    const params = new URLSearchParams();
    if (typeof options?.page === "number") {
      params.set("page", String(options.page));
    }
    if (typeof options?.page_size === "number") {
      params.set("page_size", String(options.page_size));
    }

    const query = params.toString();
    const requestUrl = `/api/goals/${id}/sessions${query ? `?${query}` : ""}`;
    goalsDebugLog("getGoalSessions:request", { id, requestUrl, options });
    const res = await fetch(requestUrl);
    goalsDebugLog("getGoalSessions:responseStatus", { id, status: res.status });
    if (!res.ok) throw new Error("Failed to fetch goal sessions");

    const data = await res.json();
    goalsDebugLog("getGoalSessions:rawPayload", data);

    const normalizeSession = (item: unknown): Session | null => {
      if (!item || typeof item !== "object") return null;
      const session = item as Record<string, unknown>;

      if (typeof session.id !== "string" && typeof session.id !== "number") {
        return null;
      }

      const activity =
        session.activity && typeof session.activity === "object"
          ? (session.activity as Record<string, unknown>)
          : null;

      return {
        id: String(session.id),
        started_at:
          typeof session.started_at === "string" ? session.started_at : "",
        ended_at:
          typeof session.ended_at === "string" ? session.ended_at : null,
        total_duration_seconds:
          typeof session.total_duration_seconds === "number"
            ? session.total_duration_seconds
            : null,
        focused_duration_seconds:
          typeof session.focused_duration_seconds === "number"
            ? session.focused_duration_seconds
            : null,
        xp_total: typeof session.xp_total === "number" ? session.xp_total : 0,
        xp_physique:
          typeof session.xp_physique === "number" ? session.xp_physique : 0,
        xp_energy:
          typeof session.xp_energy === "number" ? session.xp_energy : 0,
        xp_logic: typeof session.xp_logic === "number" ? session.xp_logic : 0,
        xp_creativity:
          typeof session.xp_creativity === "number" ? session.xp_creativity : 0,
        xp_social:
          typeof session.xp_social === "number" ? session.xp_social : 0,
        completed_reason:
          typeof session.completed_reason === "string"
            ? session.completed_reason
            : null,
        activity:
          activity &&
          (typeof activity.id === "string" ||
            typeof activity.id === "number") &&
          typeof activity.name === "string" &&
          typeof activity.emoji === "string"
            ? {
                id: String(activity.id),
                name: activity.name,
                emoji: activity.emoji,
              }
            : null,
      };
    };

    const normalizeSessions = (items: unknown[]): Session[] => {
      return items
        .map((item) => normalizeSession(item))
        .filter((item): item is Session => item !== null);
    };

    const sessionsCandidate = Array.isArray(data)
      ? data
      : data &&
          typeof data === "object" &&
          "results" in data &&
          Array.isArray((data as { results?: unknown }).results)
        ? ((data as { results: unknown[] }).results ?? [])
        : data &&
            typeof data === "object" &&
            "data" in data &&
            Array.isArray((data as { data?: unknown }).data)
          ? ((data as { data: unknown[] }).data ?? [])
          : data &&
              typeof data === "object" &&
              "items" in data &&
              Array.isArray((data as { items?: unknown }).items)
            ? ((data as { items: unknown[] }).items ?? [])
            : [];

    const sessionsList = normalizeSessions(sessionsCandidate);
    goalsDebugLog("getGoalSessions:normalizedSummary", {
      id,
      sessionsCount: sessionsList.length,
      firstSession: sessionsList[0] ?? null,
    });

    const count =
      data &&
      typeof data === "object" &&
      typeof (data as { count?: unknown }).count === "number"
        ? (data as { count: number }).count
        : sessionsList.length;

    const next =
      data && typeof data === "object" && "next" in data
        ? ((data as { next?: string | null }).next ?? null)
        : null;

    const previous =
      data && typeof data === "object" && "previous" in data
        ? ((data as { previous?: string | null }).previous ?? null)
        : null;

    return {
      count,
      next,
      previous,
      results: sessionsList,
    };
  },

  async createGoal(data: CreateGoalPayload): Promise<Goal> {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create goal");
    const payload = await res.json();
    const normalized = normalizeGoal(payload);
    if (!normalized) throw new Error("Invalid goal payload");
    return normalized;
  },

  async updateGoal(
    id: string,
    data: { title?: string; description?: string; finish_by?: string },
  ): Promise<Goal> {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update goal");
    const payload = await res.json();
    const normalized = normalizeGoal(payload);
    if (!normalized) throw new Error("Invalid goal payload");
    return normalized;
  },

  async deleteGoal(id: string): Promise<void> {
    const res = await fetch(`/api/goals/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete goal");
  },
};
