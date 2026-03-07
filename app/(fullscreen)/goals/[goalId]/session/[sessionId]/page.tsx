"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/src/context/AuthContext";
import { GoalsService } from "@/src/lib/services/goals";
import {
  BoltIcon,
  ChevronUpIcon,
  PauseIcon,
  PlayIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { useMutation, useQuery } from "convex/react";
import { DumbbellIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { FaBrain, FaHammer } from "react-icons/fa";

// ── Types ──

type GoalDisplayData = {
  title: string;
  emoji: string;
  category: string;
  categoryColor: string;
};

type XpRates = {
  physique: number;
  energy: number;
  logic: number;
  creativity: number;
  social: number;
};

type SessionFinalStats = {
  endedAt: number;
  totalDurationSeconds: number;
  focusedDurationSeconds: number;
  xpTotal: number;
  xpBreakdown: XpRates;
};

// ── Module-level helpers (no component state closures) ──

async function fetchXpRates(
  activityId: number,
  goalIntId: number,
  retries = 1,
): Promise<XpRates> {
  const res = await fetch("/api/sessions/calculate-rates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activity_id: activityId, goal_id: goalIntId }),
  });
  if (!res.ok) {
    if (retries > 0) return fetchXpRates(activityId, goalIntId, retries - 1);
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? "Failed to calculate XP rates",
    );
  }
  const data = await res.json();
  return data.rates as XpRates;
}

async function syncSessionToDjango(
  sessionId: string,
  stats: SessionFinalStats,
  completedReason: "manual" | "abandoned",
) {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "completed",
      ended_at: new Date(stats.endedAt).toISOString(),
      total_duration_seconds: Math.floor(stats.totalDurationSeconds),
      focused_duration_seconds: Math.floor(stats.focusedDurationSeconds),
      xp_total: stats.xpTotal,
      xp_physique: stats.xpBreakdown.physique,
      xp_energy: stats.xpBreakdown.energy,
      xp_logic: stats.xpBreakdown.logic,
      xp_creativity: stats.xpBreakdown.creativity,
      xp_social: stats.xpBreakdown.social,
      completed_reason: completedReason,
      device_platform: "web",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? "Failed to sync session to Django",
    );
  }
}

function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// ── Component ──

interface SessionTimerProps {
  params: Promise<{ goalId: string; sessionId: string }>;
}

export default function SessionTimer({ params }: SessionTimerProps) {
  const { goalId, sessionId: sessionIdStr } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { me } = useAuth();

  const isNew = sessionIdStr === "new";
  const [createdSessionId, setCreatedSessionId] =
    useState<Id<"sessions"> | null>(null);
  const creatingRef = useRef(false);

  const sessionId = isNew ? createdSessionId : (sessionIdStr as Id<"sessions">);

  // ── Goal data from Django ──
  const [goalData, setGoalData] = useState<GoalDisplayData | null>(null);
  const [goalIntId, setGoalIntId] = useState<number | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);

  useEffect(() => {
    GoalsService.getGoal(goalId)
      .then((goal) => {
        setGoalData({
          title: goal.title,
          emoji: goal.emoji,
          category: goal.category?.name ?? "",
          categoryColor: goal.category?.color ?? "#4187a2",
        });
        setGoalIntId(parseInt(goal.id, 10));
      })
      .catch(() => setGoalError("Failed to load goal data"));
  }, [goalId]);

  const [showStats, setShowStats] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // ── Convex subscription & mutations ──
  const session = useQuery(
    api.sessions.getSession,
    sessionId ? { sessionId } : "skip",
  );
  const startMutation = useMutation(api.sessions.startSession);
  const heartbeatMutation = useMutation(api.sessions.heartbeat);
  const pauseMutation = useMutation(api.sessions.pauseSession);
  const resumeMutation = useMutation(api.sessions.resumeSession);
  const completeMutation = useMutation(api.sessions.completeSession);
  const abandonMutation = useMutation(api.sessions.abandonSession);
  const markSyncedMutation = useMutation(api.sessions.markSyncedToDjango);

  const isRunning = session?.status === "live";
  const isPaused = session?.status === "paused";
  const isActive = isRunning || isPaused;
  // Flat primitive so React Compiler can track it without inferring the whole session object
  const sessionSynced = session?.syncedToDjango ?? false;

  // ── Display time ──
  // localTick counts up inside the interval callback (not sync in effect body).
  // displayTime = max(localTick, convexTime) always shows at least the server
  // value, staying smooth between heartbeats without setState-in-effect.
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }); // no deps — keeps ref current after every render
  const [localTick, setLocalTick] = useState(0);

  // ── Check for existing active session before creating ──
  const existingSession = useQuery(
    api.sessions.getActiveSession,
    isNew && me ? { userId: String(me.id) } : "skip",
  );

  // ── Create session when sessionId is "new" ──
  useEffect(() => {
    if (
      !isNew ||
      createdSessionId ||
      creatingRef.current ||
      !me ||
      !goalData ||
      goalIntId === null
    )
      return;
    if (existingSession === undefined) return; // still loading

    if (existingSession) {
      router.replace(`/goals/${goalId}/session/${existingSession._id}`);
      return;
    }

    creatingRef.current = true;

    const activityIdStr = searchParams.get("activity") ?? "";
    const activityId = parseInt(activityIdStr, 10);

    // Validate then fetch — all setState calls live inside async callbacks
    Promise.resolve(activityId)
      .then((aid) => {
        if (isNaN(aid)) {
          throw new Error(
            "Invalid activity — please go back and select a valid activity.",
          );
        }
        return fetchXpRates(aid, goalIntId);
      })
      .then(async (rates) => {
        const startedAt = new Date().toISOString();
        const id = await startMutation({
          userId: String(me.id),
          goalId,
          activityId: activityIdStr,
          rates,
          deviceContext: { platform: "web" },
        });

        // Register session start with Django (fire-and-forget — don't block the timer)
        fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: id,
            user_id: me.id,
            goal: goalIntId,
            activity: activityId,
            status: "active",
            started_at: startedAt,
            device_platform: "web",
          }),
        }).catch((err) =>
          console.error("Failed to register session start with Django:", err),
        );

        setCreatedSessionId(id);
        router.replace(`/goals/${goalId}/session/${id}`);
      })
      .catch((err: Error) => {
        setRatesError(err.message);
        creatingRef.current = false;
      });
  }, [
    isNew,
    createdSessionId,
    me,
    existingSession,
    goalData,
    goalIntId,
    goalId,
    searchParams,
    startMutation,
    router,
  ]);

  // Tick effect: increments localTick inside the interval callback (never sync in effect body).
  // startTime is captured once per run so the counter is relative to when isRunning became true.
  useEffect(() => {
    if (!isRunning) return;
    const startTime = Math.floor(sessionRef.current?.focusedDurationSeconds ?? 0);
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      const convex = Math.floor(sessionRef.current?.focusedDurationSeconds ?? 0);
      setLocalTick(Math.max(startTime + ticks, convex));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // displayTime = max(localTick, convexTime) — always shows at least the server value,
  // stays smooth between heartbeats, and never requires Date.now() in render.
  const convexTime = Math.floor(session?.focusedDurationSeconds ?? 0);
  const displayTime = Math.max(localTick, convexTime);

  // ── Heartbeat every 5s when live ──
  useEffect(() => {
    if (!isRunning || !sessionId) return;
    const interval = setInterval(() => {
      heartbeatMutation({ sessionId }).catch(console.error);
    }, 5000);
    heartbeatMutation({ sessionId }).catch(console.error);
    return () => clearInterval(interval);
  }, [isRunning, sessionId, heartbeatMutation]);

  // ── Auto-redirect for already-completed+synced sessions (e.g. page refresh) ──
  const sessionStatus = session?.status;
  useEffect(() => {
    if (sessionStatus === "completed" && sessionSynced && sessionId && !isSyncing) {
      router.push(`/goals/${goalId}/session/${sessionId}/reflection`);
    }
  }, [sessionStatus, sessionSynced, sessionId, goalId, isSyncing, router]);

  // ── XP data from Convex ──
  const xpGained = session?.xpTotal ?? 0;
  const aspects = [
    {
      name: "Creativity",
      icon: <FaBrain className="w-4 h-4" />,
      xp: Math.floor(session?.xpBreakdown?.creativity ?? 0),
      color: "#4187a2",
    },
    {
      name: "Physique",
      icon: <DumbbellIcon className="w-4 h-4" />,
      xp: Math.floor(session?.xpBreakdown?.physique ?? 0),
      color: "#8d2e2e",
    },
    {
      name: "Energy",
      icon: <BoltIcon className="w-4 h-4" />,
      xp: Math.floor(session?.xpBreakdown?.energy ?? 0),
      color: "#c49352",
    },
    {
      name: "Logic",
      icon: <FaHammer className="w-4 h-4" />,
      xp: Math.floor(session?.xpBreakdown?.logic ?? 0),
      color: "#713599",
    },
    {
      name: "Social",
      icon: <UsersIcon className="w-4 h-4" />,
      xp: Math.floor(session?.xpBreakdown?.social ?? 0),
      color: "#31784e",
    },
  ];

  // ── Handlers ──

  const handleToggle = useCallback(async () => {
    if (!sessionId || !isActive) return;
    if (isRunning) {
      await pauseMutation({ sessionId, reason: "user_initiated" });
    } else if (isPaused) {
      await resumeMutation({ sessionId });
    }
  }, [isRunning, isPaused, isActive, sessionId, pauseMutation, resumeMutation]);

  const handleFinish = useCallback(async () => {
    if (!sessionId || !isActive || isSyncing) return;
    setIsSyncing(true);

    try {
      const finalStats = await completeMutation({ sessionId, reason: "manual" });

      if (!sessionSynced) {
        try {
          await syncSessionToDjango(sessionId, finalStats, "manual");
          await markSyncedMutation({ sessionId });
        } catch (err) {
          console.error("Failed to sync completed session to Django:", err);
          // Don't block redirect — Convex session is complete; Django sync can be retried later
        }
      }

      router.push(`/goals/${goalId}/session/${sessionId}/reflection`);
    } catch (err) {
      console.error("Failed to complete session:", err);
      setIsSyncing(false);
    }
  }, [
    sessionId,
    isActive,
    isSyncing,
    sessionSynced,
    completeMutation,
    markSyncedMutation,
    router,
    goalId,
  ]);

  const handleDiscard = useCallback(async () => {
    if (!sessionId || !isActive || isSyncing) return;
    if (!confirm("Discard this session?")) return;
    setIsSyncing(true);

    try {
      const finalStats = await abandonMutation({
        sessionId,
        interruptionReason: "user_discarded",
      });

      if (!sessionSynced) {
        try {
          await syncSessionToDjango(sessionId, finalStats, "abandoned");
          await markSyncedMutation({ sessionId });
        } catch (err) {
          console.error("Failed to sync abandoned session to Django:", err);
        }
      }

      router.push(`/goals/${goalId}`);
    } catch (err) {
      console.error("Failed to abandon session:", err);
      setIsSyncing(false);
    }
  }, [
    sessionId,
    isActive,
    isSyncing,
    sessionSynced,
    abandonMutation,
    markSyncedMutation,
    router,
    goalId,
  ]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handleToggle();
          break;
        case "Escape":
          handleFinish();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggle, handleFinish]);

  // ── Update browser tab title with timer ──
  useEffect(() => {
    const timeStr = formatTime(displayTime);
    const status = isRunning ? "▶" : "⏸";
    const title = goalData?.title ?? "Session";
    document.title = `${status} ${timeStr} - ${title}`;
    return () => {
      document.title = "LifeXP";
    };
  }, [displayTime, isRunning, goalData?.title]);

  // ── Error state ──
  if (ratesError || goalError) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-white/60 text-lg max-w-sm">
          {ratesError ?? goalError}
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  // ── Loading state ──
  if (session === undefined || !goalData) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin" />
      </div>
    );
  }

  const { categoryColor } = goalData;

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden select-none">
      {/* Gradient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-around py-20 px-6">
        {/* Goal info */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-5xl text-center text-white/40">
            {goalData.title}
          </h1>
        </div>
        <div className="flex flex-col items-center gap-4 mb-12">
          <span className="text-7xl">{goalData.emoji}</span>
          <p style={{ color: categoryColor }} className="text-xl font-bold">
            {goalData.category}
          </p>
        </div>

        {/* Timer */}
        <div className="relative mb-8">
          {isRunning && (
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ backgroundColor: categoryColor, animationDuration: "3s" }}
            />
          )}
          <div
            className="text-[100px] md:text-[100px] opacity-80 font-semibold text-white tracking-tighter tabular-nums"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatTime(displayTime)}
          </div>
        </div>

        {/* XP indicator */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer mb-12"
        >
          <span
            className="text-lg font-semibold"
            style={{ color: categoryColor }}
          >
            +{Math.floor(xpGained)} XP
          </span>
          <ChevronUpIcon
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showStats ? "rotate-180" : ""}`}
          />
        </button>

        {/* Stats dropdown */}
        {showStats && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 bg-gray-900/90 backdrop-blur-xl rounded-2xl p-5 border border-gray-800 min-w-[280px]">
            <div className="flex flex-wrap gap-3 justify-center">
              {aspects.map((aspect, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50"
                >
                  <span style={{ color: aspect.color }}>{aspect.icon}</span>
                  <span className="text-sm text-gray-300">+{aspect.xp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleDiscard}
            disabled={isSyncing}
            className="h-14 w-24 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
          >
            Discard
          </button>

          <button
            onClick={handleToggle}
            disabled={isSyncing}
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105 disabled:opacity-40"
            style={{ backgroundColor: categoryColor }}
            title={isRunning ? "Pause" : "Resume"}
          >
            {isRunning ? (
              <PauseIcon className="w-8 h-8 text-white" />
            ) : (
              <PlayIcon className="w-8 h-8 text-white ml-1" />
            )}
          </button>

          <button
            onClick={handleFinish}
            disabled={isSyncing}
            className="px-6 h-14 w-24 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
          >
            {isSyncing ? "Saving…" : "Finish"}
          </button>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-4 text-gray-600 text-xs hidden md:flex">
        <span>
          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-500 mr-1">
            Space
          </kbd>
          {isRunning ? "Pause" : "Resume"}
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-500 mr-1">
            Esc
          </kbd>
          Finish
        </span>
      </div>
    </div>
  );
}
