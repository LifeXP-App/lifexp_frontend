"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/src/context/AuthContext";
import { authedFetch } from "@/src/lib/api/authedFetch";
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
import posthog from "posthog-js";

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

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const HEARTBEAT_SECONDS = 5;

const activityTypeColors: Record<string, string> = {
  physique: "#8d2e2e",
  energy: "#c49352",
  logic: "#713599",
  creativity: "#4187a2",
  social: "#31784e",
};


// The rates passed via the URL `rates` param (from the activity picker) and the
// `xp_increase_rate_per_second` returned by Django are BOTH already per-second.
// Just normalize the shape — do not divide again.
function normalizeRates(r: Record<string, unknown> | null | undefined): XpRates {
  return {
    physique: typeof r?.physique === "number" ? r.physique : 0,
    energy: typeof r?.energy === "number" ? r.energy : 0,
    logic: typeof r?.logic === "number" ? r.logic : 0,
    creativity: typeof r?.creativity === "number" ? r.creativity : 0,
    social: typeof r?.social === "number" ? r.social : 0,
  };
}

async function syncSessionToDjango(
  sessionId: string,
  stats: SessionFinalStats,
  completedReason: "manual" | "abandoned",
) {
  const res = await authedFetch(`/api/sessions/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "completed",
      ended_at: new Date(stats.endedAt).toISOString(),
      total_duration_seconds: Math.floor(stats.totalDurationSeconds),
      focused_duration_seconds: Math.floor(stats.focusedDurationSeconds),
      // Django stores xp_* as integers; the Convex breakdown is fractional
      // (rate × seconds), so round before sending or the PUT 400s.
      xp_total: Math.round(stats.xpTotal),
      xp_physique: Math.round(stats.xpBreakdown.physique),
      xp_energy: Math.round(stats.xpBreakdown.energy),
      xp_logic: Math.round(stats.xpBreakdown.logic),
      xp_creativity: Math.round(stats.xpBreakdown.creativity),
      xp_social: Math.round(stats.xpBreakdown.social),
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
  const total = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Shown instead of the normal owner controls when viewing someone else's live
// session: no pause/discard/finish, just a one-shot nudge + a way back out.
function SpectatorControls({
  sessionId,
  categoryColor,
  onClose,
}: {
  sessionId: Id<"sessions"> | null;
  categoryColor: string;
  onClose: () => void;
}) {
  const [nudged, setNudged] = useState(false);

  const handleNudge = useCallback(async () => {
    if (nudged || !sessionId) return;
    setNudged(true);
    try {
      await authedFetch(`/api/sessions/${sessionId}/nudge`, { method: "POST" });
    } catch (err) {
      console.error("Failed to nudge session:", err);
    }
  }, [nudged, sessionId]);

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleNudge}
        disabled={nudged}
        className="w-36 h-14 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-default"
      >
        {nudged ? "Nudged 👋" : "Nudge 👋"}
      </button>

      <button
        onClick={onClose}
        className="w-36 h-14 rounded-full text-white font-medium transition-transform cursor-pointer hover:scale-105"
        style={{ backgroundColor: categoryColor }}
      >
        Close
      </button>
    </div>
  );
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
  const isEmptySession = goalId === "none";
  const [createdSessionId, setCreatedSessionId] =
    useState<Id<"sessions"> | null>(null);
  const creatingRef = useRef(false);

  const sessionId = isNew ? createdSessionId : (sessionIdStr as Id<"sessions">);

  // ── Goal data from Django ──
  const [goalData, setGoalData] = useState<GoalDisplayData | null>(null);
  const [goalIntId, setGoalIntId] = useState<number | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);

  useEffect(() => {
    if (isEmptySession) {
      setGoalData({
        title: "Free Session",
        emoji: "⚡",
        category: "",
        categoryColor: "#4187a2",
      });
      return;
    }

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
  }, [goalId, isEmptySession]);

  const [showStats, setShowStats] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Collapse the XP stats dropdown when clicking outside of it
  useEffect(() => {
    if (!showStats) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (statsRef.current && !statsRef.current.contains(e.target as Node)) {
        setShowStats(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStats]);

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
  const updateInitialRatesMutation = useMutation(api.sessions.updateInitialRates);
  const markSyncedMutation = useMutation(api.sessions.markSyncedToDjango);

  const isRunning = session?.status === "live";
  const isPaused = session?.status === "paused";
  const isActive = isRunning || isPaused;
  // Flat primitive so React Compiler can track it without inferring the whole session object
  const sessionSynced = session?.syncedToDjango ?? false;
  // Whether the logged-in user owns this session, vs. viewing someone else's live session
  const isOwn = Boolean(me && session && session.userId === String(me.id));

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
      (goalIntId === null && !isEmptySession)
    )
      return;
    if (existingSession === undefined) return; // still loading

    if (existingSession) {
      router.replace(`/goals/${goalId}/session/${existingSession._id}`);
      return;
    }

    creatingRef.current = true;

    const activityIdStr = searchParams.get("activity") ?? "";

    if (!activityIdStr.trim()) {
      setRatesError("Invalid activity — please go back and select a valid activity.");
      creatingRef.current = false;
      return;
    }

    const ratesParam = searchParams.get("rates");
    let parsedRates: Record<string, number> | null = null;
    if (ratesParam) {
      try { parsedRates = JSON.parse(decodeURIComponent(ratesParam)); } catch { /* ignore */ }
    }
    const rates = normalizeRates(parsedRates);

    Promise.resolve()
      .then(async () => {
        const id = await startMutation({
          userId: String(me.id),
          username: me.username,
          userProfile: me.profile_picture ?? undefined,
          goalId,
          goalTitle: goalData.title,
          activityId: activityIdStr,
          activity_uid: activityIdStr,
          rates,
          deviceContext: {
            platform: "web",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: navigator.language,
          },
        });

        // Register the session with Django BEFORE navigating. This must be awaited:
        // router.replace below changes the route and can abort an in-flight
        // fire-and-forget request, leaving Django with no session record — which
        // then makes completion (PUT) and reflection (GET) 404.
        try {
          const res = await authedFetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: id,
              ...(isEmptySession ? {} : { goal: goalIntId }),
              activity: activityIdStr,
              device_platform: "web",
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const activityUid =
              data.activity_uid === undefined ? undefined : String(data.activity_uid);
            // Django returns the authoritative per-second rates; apply them to Convex
            // so XP actually accrues (the URL rates are only an optimistic fallback).
            const r = data.xp_increase_rate_per_second;
            const djangoRates =
              r && typeof r === "object" ? normalizeRates(r) : undefined;
            await updateInitialRatesMutation({
              sessionId: id,
              activityId: activityUid,
              activity_uid: activityUid,
              activityName: data.activityName,
              activityEmoji: data.activityEmoji,
              activityType: data.activityType,
              rates: djangoRates,
            });
          } else {
            const err = await res.json().catch(() => ({}));
            console.error("Django rejected session start:", res.status, err);
          }
        } catch (err) {
          console.error("Failed to register session start with Django:", err);
        }

        posthog.capture("session_started", {
          session_id: id,
          goal_id: goalId,
          activity_id: activityIdStr,
        });
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
    isEmptySession,
    searchParams,
    startMutation,
    updateInitialRatesMutation,
    router,
  ]);

  // ── Pomodoro timer ──
  // During focus: countdown ticks only while the Convex session is live.
  // During break: countdown always ticks (Convex session is auto-paused so
  // focused duration doesn't accumulate during break time).
  const [pomodoroPhase, setPomodoroPhase] = useState<"focus" | "break">("focus");
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(FOCUS_SECONDS);

  useEffect(() => {
    // Only the owner runs the local pomodoro state machine — a spectator's
    // countdown is unrelated to the actual session and must never pause it.
    if (!isOwn) return;
    if (pomodoroPhase === "focus" && !isRunning) return;
    const id = setInterval(() => {
      setPhaseSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, pomodoroPhase, isOwn]);

  // ── Spectator elapsed-time ticker ──
  // Non-owners see a plain elapsed-time counter (mirrors Convex's
  // totalDurationSeconds), never a pomodoro countdown that could affect the
  // owner's session.
  const [spectatorElapsed, setSpectatorElapsed] = useState(0);

  useEffect(() => {
    if (isOwn || !session) return;
    setSpectatorElapsed(session.totalDurationSeconds);
  }, [isOwn, session, session?.totalDurationSeconds]);

  useEffect(() => {
    if (isOwn || !isRunning) return;
    const id = setInterval(() => setSpectatorElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isOwn, isRunning]);

  // When a phase countdown hits zero, transition to the next phase.
  // The dependency array intentionally omits sessionId/mutations to avoid
  // stale-closure re-fires; sessionId is read via ref instead.
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  });

useEffect(() => {
  if (!isOwn) return;
  if (phaseSecondsLeft > 0) return;

  const sid = sessionIdRef.current;

  if (pomodoroPhase === "focus") {
    // pause when focus ends
    if (sid) {
      pauseMutation({
        sessionId: sid,
        reason: "break_started",
      }).catch(console.error);
    }

    setPomodoroPhase("break");
    setPhaseSecondsLeft(BREAK_SECONDS);

  } else {
    // switch back to focus
    // DO NOT auto resume
    setPomodoroPhase("focus");
    setPhaseSecondsLeft(FOCUS_SECONDS);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [phaseSecondsLeft]);

  const currentRates = session?.rateSegments?.[0]?.rates;
  const ratePhysique = currentRates?.physique ?? 0;
  const rateEnergy = currentRates?.energy ?? 0;
  const rateLogic = currentRates?.logic ?? 0;
  const rateCreativity = currentRates?.creativity ?? 0;
  const rateSocial = currentRates?.social ?? 0;

  // ── Heartbeat every 5s when live (owner only — spectators never heartbeat) ──
  useEffect(() => {
    if (!isOwn) return;
    if (!isRunning) return;
    if (!sessionId) return;
    if (pomodoroPhase !== "focus") return;

    const interval = setInterval(() => {
      heartbeatMutation({
        sessionId,
        elapsedSeconds: HEARTBEAT_SECONDS,
        xpDelta: {
          physique: ratePhysique * HEARTBEAT_SECONDS,
          energy: rateEnergy * HEARTBEAT_SECONDS,
          logic: rateLogic * HEARTBEAT_SECONDS,
          creativity: rateCreativity * HEARTBEAT_SECONDS,
          social: rateSocial * HEARTBEAT_SECONDS,
        },
      }).catch(console.error);
    }, HEARTBEAT_SECONDS * 1000);

    return () => clearInterval(interval);
  }, [
    isOwn,
    isRunning,
    sessionId,
    pomodoroPhase,
    ratePhysique,
    rateEnergy,
    rateLogic,
    rateCreativity,
    rateSocial,
    heartbeatMutation,
  ]);
  // ── Auto-redirect for already-completed+synced sessions (e.g. page refresh) ──
  const sessionStatus = session?.status;
  useEffect(() => {
    if (sessionStatus === "completed" && sessionSynced && sessionId && !isSyncing) {
      router.push(`/goals/${goalId}/session/${sessionId}/reflection`);
    }
  }, [sessionStatus, sessionSynced, sessionId, goalId, isSyncing, router]);

  // ── Local XP projection (ticks every second, grounded in Convex session data) ──
  // Convex heartbeats keep server state accurate every 5s; this mirrors the same
  // formula client-side so the display increments smoothly every second.
  const [localXpTotal, setLocalXpTotal] = useState(0);
  const [localXpBreakdown, setLocalXpBreakdown] = useState<XpRates>({
    physique: 0,
    energy: 0,
    logic: 0,
    creativity: 0,
    social: 0,
  });

  useEffect(() => {
    if (!session) return;

    const DIMS = ["physique", "energy", "logic", "creativity", "social"] as const;

    function recalcLocal() {
      if (!session) return;
      const now = Date.now();

      // Mirror Convex's getTotalPauseDurationMs: unclosed interval uses `now`
      let pausedMs = 0;
      for (const interval of session.pauseIntervals) {
        pausedMs += (interval.resumedAt ?? now) - interval.pausedAt;
      }
      const focusedSeconds = Math.max(
        0,
        (now - session.startedAt) / 1000 - pausedMs / 1000,
      );

      // Mirror Convex's calculateXP
      const breakdown: XpRates = { physique: 0, energy: 0, logic: 0, creativity: 0, social: 0 };
      for (let i = 0; i < session.rateSegments.length; i++) {
        const seg = session.rateSegments[i];
        if (seg.atSecond >= focusedSeconds) break;
        const segEnd =
          i + 1 < session.rateSegments.length
            ? session.rateSegments[i + 1].atSecond
            : focusedSeconds;
        const duration = Math.min(segEnd, focusedSeconds) - seg.atSecond;
        for (const dim of DIMS) {
          breakdown[dim] += seg.rates[dim] * duration;
        }
      }
      const total = Math.floor(DIMS.reduce((sum, dim) => sum + breakdown[dim], 0));

      setLocalXpTotal(total);
      setLocalXpBreakdown({ ...breakdown });
    }

    recalcLocal();
    const id = setInterval(recalcLocal, 1000);
    return () => clearInterval(id);
  }, [session]); // re-subscribes whenever Convex session data changes

  // ── XP display ──
  const xpGained = localXpTotal;
  const aspects = [
    {
      name: "Creativity",
      icon: <FaBrain className="w-5 h-5" />,
      xp: Math.floor(localXpBreakdown.creativity),
      color: "#4187a2",
    },
    {
      name: "Physique",
      icon: <DumbbellIcon className="w-5 h-5" />,
      xp: Math.floor(localXpBreakdown.physique),
      color: "#8d2e2e",
    },
    {
      name: "Energy",
      icon: <BoltIcon className="w-5 h-5" />,
      xp: Math.floor(localXpBreakdown.energy),
      color: "#c49352",
    },
    {
      name: "Logic",
      icon: <FaHammer className="w-5 h-5" />,
      xp: Math.floor(localXpBreakdown.logic),
      color: "#713599",
    },
    {
      name: "Social",
      icon: <UsersIcon className="w-5 h-5" />,
      xp: Math.floor(localXpBreakdown.social),
      color: "#31784e",
    },
  ];

  // ── Handlers ──

  const handleToggle = useCallback(async () => {
    if (!sessionId || !isActive) return;
    if (isRunning) {
      await pauseMutation({ sessionId, reason: "user_initiated" });
      posthog.capture("session_paused", { session_id: sessionId, goal_id: goalId });
    } else if (isPaused) {
      await resumeMutation({ sessionId });
      posthog.capture("session_resumed", { session_id: sessionId, goal_id: goalId });

      if (pomodoroPhase === "break") {
        setPomodoroPhase("focus");
        setPhaseSecondsLeft(FOCUS_SECONDS);
      }
    }
  }, [isRunning, isPaused, isActive, sessionId, goalId, pauseMutation, resumeMutation]);

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

      posthog.capture("session_completed", {
        session_id: sessionId,
        goal_id: goalId,
        xp_total: finalStats.xpTotal,
        duration_seconds: finalStats.totalDurationSeconds,
        focused_seconds: finalStats.focusedDurationSeconds,
      });
      router.push(`/goals/${goalId}/session/${sessionId}/reflection`);
    } catch (err) {
      console.error("Failed to complete session:", err);
      posthog.captureException(err);
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

      posthog.capture("session_abandoned", {
        session_id: sessionId,
        goal_id: goalId,
        xp_total: finalStats.xpTotal,
        duration_seconds: finalStats.totalDurationSeconds,
      });
      router.push(isEmptySession ? "/goals" : `/goals/${goalId}`);
    } catch (err) {
      console.error("Failed to abandon session:", err);
      posthog.captureException(err);
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
    isEmptySession,
  ]);

  const handleSkipBreak = useCallback(async () => {
    if (!sessionId) return;
    try {
      await resumeMutation({ sessionId });
    } catch (err) {
      console.error("Failed to skip break:", err);
    }
    setPomodoroPhase("focus");
    setPhaseSecondsLeft(FOCUS_SECONDS);
  }, [sessionId, resumeMutation]);

  const handleAdjustTime = useCallback((deltaSeconds: number) => {
    setPhaseSecondsLeft((prev) => Math.max(0, prev + deltaSeconds));
  }, []);

  // ── Keyboard shortcuts (owner only — spectators have no session controls) ──
  useEffect(() => {
    if (!isOwn) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (pomodoroPhase === "break") {
            handleSkipBreak();
          } else {
            handleToggle();
          }
          break;
        case "Escape":
          handleFinish();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOwn, pomodoroPhase, handleToggle, handleSkipBreak, handleFinish]);

  // ── Update browser tab title with timer ──
  useEffect(() => {
    const timeStr = isOwn ? formatTime(phaseSecondsLeft) : formatTime(spectatorElapsed);
    const status = isOwn
      ? (pomodoroPhase === "break" ? "☕" : (isRunning ? "▶" : "⏸"))
      : (isRunning ? "👀" : "⏸");
    const title = isOwn && pomodoroPhase === "break" ? "Break" : (goalData?.title ?? "Session");
    document.title = `${status} ${timeStr} - ${title}`;
    return () => {
      document.title = "GamiLife";
    };
  }, [phaseSecondsLeft, spectatorElapsed, isRunning, pomodoroPhase, goalData?.title, isOwn]);

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

  const activityType = session?.activityType;
  const isBreak = pomodoroPhase === "break";
  const categoryColor = isBreak
    ? "var(--rookie-primary)"
    : activityType && activityTypeColors[activityType]
      ? activityTypeColors[activityType]
      : goalData.categoryColor;
  const activityEmoji = isBreak ? "⏰" : (session?.activityEmoji ?? goalData.emoji);
  const activityLabel = isBreak
    ? "Break"
    : (session?.activityName ?? activityType ?? goalData.category);

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
            {isBreak ? "Take some rest" : goalData.title}
          </h1>
        </div>
        <div className="flex flex-col items-center gap-4 mb-12">
          <span className="text-7xl">{activityEmoji}</span>
          <p style={{ color: categoryColor }} className="text-xl font-bold">
            {activityLabel}
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
            {isOwn ? formatTime(phaseSecondsLeft) : formatTime(spectatorElapsed)}
          </div>
        </div>

        {/* XP indicator */}
        <div className="relative mb-12" ref={statsRef}>
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
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
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-96 backdrop-blur-2xl bg-black/70 rounded-3xl border border-white/10 shadow-2xl shadow-black/60 p-4 z-20"
            >
              {(() => {
                const hasAnyXp = aspects.some((a) => a.xp > 0);
                const maxXp = Math.max(1, ...aspects.map((a) => a.xp));
                const visible = (hasAnyXp ? aspects.filter((a) => a.xp > 0) : aspects)
                  .slice()
                  .sort((a, b) => b.xp - a.xp);

                return visible.map((aspect, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-3 py-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <span
                      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${aspect.color}26`, color: aspect.color }}
                    >
                      {aspect.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-300">
                          {aspect.name}
                        </span>
                        <span
                          className="text-sm font-semibold tabular-nums"
                          style={{ color: aspect.color }}
                        >
                          +{aspect.xp}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(aspect.xp / maxXp) * 100}%`,
                            backgroundColor: aspect.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Controls */}
        {!isOwn ? (
          <SpectatorControls
            sessionId={sessionId}
            categoryColor={categoryColor}
            onClose={() => router.back()}
          />
        ) : isBreak ? (
          <div className="flex items-center gap-4">
            <button
              onClick={handleSkipBreak}
              disabled={isSyncing}
              className="h-14 w-24 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              Skip
            </button>

            <button
              onClick={handleFinish}
              disabled={isSyncing}
              className="px-6 h-14 w-24 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              {isSyncing ? "Saving…" : "Finish"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={handleDiscard}
              disabled={isSyncing}
              className="h-14 w-24 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              Discard
            </button>

            <button
              onClick={() => handleAdjustTime(-60)}
              disabled={isSyncing}
              title="Subtract 60 seconds"
              className="h-16 w-16 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              -60
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
              onClick={() => handleAdjustTime(60)}
              disabled={isSyncing}
              title="Add 60 seconds"
              className="h-16 w-16 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              +60
            </button>

            <button
              onClick={handleFinish}
              disabled={isSyncing}
              className="px-6 h-14 w-24 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              {isSyncing ? "Saving…" : "Finish"}
            </button>
          </div>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-4 text-gray-600 text-xs hidden md:flex">
        <span>
          <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-500 mr-1">
            Space
          </kbd>
          {isBreak ? "Skip break" : (isRunning ? "Pause" : "Resume")}
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
