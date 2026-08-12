"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/src/context/AuthContext";
import { useToast, useConfirm } from "@/src/context/ToastContext";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { getResponseError } from "@/src/lib/api/responseError";
import { GoalsService } from "@/src/lib/services/goals";
import {
  BoltIcon,
  ChevronUpIcon,
  PauseIcon,
  PlayIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { useMutation, useQuery } from "convex/react";
import { useQueryClient } from "@tanstack/react-query";
import { DumbbellIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { FaBrain, FaHammer } from "react-icons/fa";
import posthog from "posthog-js";

// ── Types ──

// A Goal has no category/aspect of its own — only its activities do (via
// Activity.activity_type) — so this only carries what a Goal actually has.
type GoalDisplayData = {
  title: string;
  emoji: string;
};

// Shown before the session's real activityType has loaded (e.g. very first
// paint). Not tied to any specific aspect, unlike activityTypeColors.
const DEFAULT_ACCENT_COLOR = "var(--rookie-primary)";

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
  // Convex is the source of truth for session timing and XP (it tracks pauses,
  // breaks, and per-second accrual live — what the player actually watched
  // during the session); Django persists these numbers rather than
  // recomputing them from its own clock.
  const res = await authedFetch(`/api/sessions/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: completedReason === "abandoned" ? "abandoned" : "completed",
      ended_at: new Date(stats.endedAt).toISOString(),
      total_duration_seconds: Math.floor(stats.totalDurationSeconds),
      focused_duration_seconds: Math.floor(stats.focusedDurationSeconds),
      // Django stores xp_* as integers; the Convex breakdown is fractional
      // (rate × seconds), so round before sending.
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

// Chime played whenever a focus or break phase ends. Generated via Web Audio
// instead of a bundled asset — no file to host, works everywhere. Same 4
// notes both directions, different arrangement: focus->break rises (E5 up to
// A6) for an energizing "break time" lift; break->focus falls back down to
// the root (A6 down to E5) so it settles/resolves into "let's focus now".
function playPhaseEndChime(nextPhase: "focus" | "break") {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    function playNote(
      freq: number,
      start: number,
      duration: number,
      volume = 0.18
    ) {
      // Warm triangle layer
      const tri = ctx.createOscillator();
      tri.type = "triangle";
      tri.frequency.value = freq;

      // Soft sine layer
      const sine = ctx.createOscillator();
      sine.type = "sine";
      sine.frequency.value = freq * 2;

      const gain = ctx.createGain();

      // Smooth attack
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);

      // Gentle decay
      gain.gain.exponentialRampToValueAtTime(
        volume * 0.55,
        start + duration * 0.45
      );

      // Long release
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        start + duration
      );

      tri.connect(gain);
      sine.connect(gain);
      gain.connect(ctx.destination);

      tri.start(start);
      sine.start(start);

      tri.stop(start + duration);
      sine.stop(start + duration);
    }

    const now = ctx.currentTime;

    // LifeXP signature — same 4 notes, arranged to match the mood of what's
    // starting next.
    if (nextPhase === "break") {
      // Rising: E5 -> B5 -> C#6 -> A6, lifts up into break time.
      playNote(659.25, now, 0.22);          // E5
      playNote(987.77, now + 0.10, 0.24);   // B5
      playNote(1108.73, now + 0.22, 0.28);  // C#6
      playNote(1760.00, now + 0.36, 0.60);  // A6
    } else {
      // Falling: A6 -> C#6 -> B5 -> E5, settles back down to the root — "ok, let's focus now".
      playNote(1760.00, now, 0.18);          // A6
      playNote(1108.73, now + 0.10, 0.20);   // C#6
      playNote(987.77, now + 0.20, 0.22);    // B5
      playNote(659.25, now + 0.32, 0.55);    // E5
    }

    setTimeout(() => {
      ctx.close();
    }, 1500);

  } catch (err) {
    console.error("Failed to play phase-end chime:", err);
  }
}

// Shown instead of the normal owner controls when viewing someone else's live
// session: no pause/discard/finish, just a one-shot nudge + a way back out.
function SpectatorControls({
  sessionId,
  onNudgeChange,
  categoryColor,
  onClose,
}: {
  sessionId: Id<"sessions"> | null;
  onNudgeChange: (isNudged: boolean) => void;
  categoryColor: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [nudged, setNudged] = useState<boolean | null>(null);
  const [nudging, setNudging] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setNudged(null);
      return;
    }

    let active = true;
    setNudged(null);

    void authedFetch(`/api/sessions/${sessionId}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            await getResponseError(response, "Could not load nudge state"),
          );
        }

        const data = (await response.json()) as { is_nudged?: unknown };
        if (typeof data.is_nudged !== "boolean") {
          throw new Error("The nudge service returned an invalid response.");
        }
        if (active) {
          setNudged(data.is_nudged);
          onNudgeChange(data.is_nudged);
        }
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to load nudge state:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load nudge state",
        );
      });

    return () => {
      active = false;
    };
  }, [onNudgeChange, sessionId, toast]);

  const handleNudge = useCallback(async () => {
    if (nudging || !sessionId || nudged === null) return;
    const previousNudged = nudged;
    const nextNudged = !nudged;
    setNudged(nextNudged);
    onNudgeChange(nextNudged);
    setNudging(true);
    try {
      const response = await authedFetch(`/api/sessions/${sessionId}/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_nudged: nextNudged }),
      });
      if (!response.ok) {
        throw new Error(
          await getResponseError(response, "Could not update nudge"),
        );
      }
    } catch (err) {
      setNudged(previousNudged);
      onNudgeChange(previousNudged);
      console.error("Failed to nudge session:", err);
      toast.error(
        err instanceof Error ? err.message : "Could not update nudge",
      );
    } finally {
      setNudging(false);
    }
  }, [nudged, nudging, onNudgeChange, sessionId, toast]);

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleNudge}
        disabled={nudging || nudged === null}
        className="w-36 h-14 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-default"
      >
        {nudged === true ? "Nudged 👋" : "Nudge 👋"}
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
  const toast = useToast();
  const confirm = useConfirm();
  const { me } = useAuth();
  const queryClient = useQueryClient();

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
      });
      return;
    }

    GoalsService.getGoal(goalId)
      .then((goal) => {
        setGoalData({
          title: goal.title,
          emoji: goal.emoji,
        });
        setGoalIntId(parseInt(goal.id, 10));
      })
      .catch(() => setGoalError("Failed to load goal data"));
  }, [goalId, isEmptySession]);

  const [showStats, setShowStats] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSkippingBreak, setIsSkippingBreak] = useState(false);

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
  // Pause/resume/AFK-return/time-adjust all patch the local getSession cache
  // immediately (withOptimisticUpdate) so the button state and countdown
  // react on the same frame the user clicks, instead of waiting on a round
  // trip to Convex — the real response then just confirms the same value.
  // Pushing/closing a pauseIntervals entry here (mirroring what the real
  // mutation does) matters: the local countdown (recalcLocal below) walks
  // pauseIntervals every second, so without this patch it would keep
  // counting focus time as accruing until the real response landed.
  const pauseMutation = useMutation(api.sessions.pauseSession).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.sessions.getSession, {
        sessionId: args.sessionId,
      });
      if (!current || current.status !== "live") return;
      localStore.setQuery(
        api.sessions.getSession,
        { sessionId: args.sessionId },
        {
          ...current,
          status: "paused",
          pauseIntervals: [
            ...current.pauseIntervals,
            { pausedAt: Date.now(), reason: args.reason },
          ],
        },
      );
    },
  );
  const returnFromAfkMutation = useMutation(
    api.sessions.returnFromAfk,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.sessions.getSession, {
      sessionId: args.sessionId,
    });
    if (!current || current.status !== "afk") return;
    const intervals = [...current.pauseIntervals];
    const last = intervals[intervals.length - 1];
    if (args.toStatus === "live" && last && last.resumedAt === undefined) {
      intervals[intervals.length - 1] = { ...last, resumedAt: Date.now() };
    }
    localStore.setQuery(
      api.sessions.getSession,
      { sessionId: args.sessionId },
      { ...current, status: args.toStatus, pauseIntervals: intervals },
    );
  });
  const resumeMutation = useMutation(api.sessions.resumeSession).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.sessions.getSession, {
        sessionId: args.sessionId,
      });
      if (!current || (current.status !== "paused" && current.status !== "afk"))
        return;
      const intervals = [...current.pauseIntervals];
      const last = intervals[intervals.length - 1];
      if (last && last.resumedAt === undefined) {
        intervals[intervals.length - 1] = { ...last, resumedAt: Date.now() };
      }
      localStore.setQuery(
        api.sessions.getSession,
        { sessionId: args.sessionId },
        {
          ...current,
          status: "live",
          pauseIntervals: intervals,
          ...(last?.reason === "break_started"
            ? {
                focusPhaseStartSeconds: current.focusedDurationSeconds,
                focusAdjustSeconds: 0,
              }
            : {}),
        },
      );
    },
  );
  const completeMutation = useMutation(api.sessions.completeSession);
  const abandonMutation = useMutation(api.sessions.abandonSession);
  const updateInitialRatesMutation = useMutation(api.sessions.updateInitialRates);
  const adjustFocusTimeMutation = useMutation(
    api.sessions.adjustFocusTime,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.sessions.getSession, {
      sessionId: args.sessionId,
    });
    if (!current) return;
    localStore.setQuery(
      api.sessions.getSession,
      { sessionId: args.sessionId },
      {
        ...current,
        focusAdjustSeconds: (current.focusAdjustSeconds ?? 0) + args.deltaSeconds,
      },
    );
  });
  const markSyncedMutation = useMutation(api.sessions.markSyncedToDjango);
  const enterAsSpectatorMutation = useMutation(
    api.sessions.enterSessionAsSpectator,
  );
  const setSpectatorNudgeMutation = useMutation(
    api.sessions.setSpectatorNudge,
  );

  const isRunning = session?.status === "live";
  const isAfk = session?.status === "afk";
  const isPaused = session?.status === "paused";
  const isActive = isRunning || isAfk || isPaused;
  // Flat primitive so React Compiler can track it without inferring the whole session object
  const sessionSynced = session?.syncedToDjango ?? false;
  const sessionOwnerId = session?.userId;
  // Whether the logged-in user owns this session, vs. viewing someone else's live session
  const isOwn = Boolean(me && sessionOwnerId === String(me.id));
  const handleSpectatorNudgeChange = useCallback(
    (isNudged: boolean) => {
      if (!sessionId || !me) return;
      void setSpectatorNudgeMutation({
        sessionId,
        userId: String(me.id),
        isNudged,
      }).catch((err) => {
        console.error("Failed to update spectator nudge badge:", err);
      });
    },
    [me, sessionId, setSpectatorNudgeMutation],
  );

  useEffect(() => {
    if (!sessionId || !sessionOwnerId || !me || isOwn) return;

    const presence = {
      sessionId,
      userId: String(me.id),
      username: me.username,
      profilePicture: me.profile_picture ?? undefined,
    };
    const refreshPresence = () => {
      void enterAsSpectatorMutation(presence).catch((err) => {
        console.error("Failed to update spectator presence:", err);
      });
    };

    refreshPresence();
    const heartbeat = window.setInterval(refreshPresence, 20_000);
    // Avoid an explicit async leave here: React Strict Mode performs an
    // effect cleanup/remount cycle, where leave can race and beat the new
    // join. Viewers naturally expire after their heartbeat stops.
    return () => window.clearInterval(heartbeat);
  }, [
    enterAsSpectatorMutation,
    isOwn,
    me,
    sessionId,
    sessionOwnerId,
  ]);

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
          userFullname: me.fullname ?? undefined,
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

        // startSession already creates the session as "live" — a brand-new
        // session autostarts focus immediately rather than landing paused,
        // so the user doesn't have to press play right after picking an
        // activity.

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
            // SessionCreateView returns activity metadata flat and camelCase
            // (activityName/activityEmoji/activityType) — it does not nest
            // under an `activity` key like SessionListSerializer does.
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
  // Also drives the focus-phase countdown (see pomodoro timer section below)
  // so it's grounded in the same pause-aware elapsed-time math as XP, and
  // survives reload without any local-only persistence of its own.
  const [localFocusedDurationSeconds, setLocalFocusedDurationSeconds] = useState(0);

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
      setLocalFocusedDurationSeconds(focusedSeconds);
    }

    recalcLocal();
    const id = setInterval(recalcLocal, 1000);
    return () => clearInterval(id);
  }, [session]); // re-subscribes whenever Convex session data changes

  // ── Pomodoro timer ──
  // Focus phase: a pomodoro break pauses the Convex session with reason
  // "break_started" (see getLiveSessions in convex/sessions.ts), so that
  // pause interval is the source of truth for which phase we're in — this
  // is what lets the phase survive a reload instead of always starting back
  // at "focus".
  const lastPauseInterval = session?.pauseIntervals[session.pauseIntervals.length - 1];
  const isOnBreak =
    isPaused &&
    lastPauseInterval !== undefined &&
    lastPauseInterval.resumedAt === undefined &&
    lastPauseInterval.reason === "break_started";

  // When the break countdown reaches 0 the phase display flips to "focus"
  // (25:00, ready to go) but — matching the original "DO NOT auto resume"
  // behavior — the underlying Convex session stays paused until the user
  // presses play. Cleared as soon as isOnBreak goes false for real (the user
  // resumed) or a new break starts.
  const [breakFinishedAwaitingResume, setBreakFinishedAwaitingResume] = useState(false);
  const pomodoroPhase: "focus" | "break" =
    isOnBreak && !breakFinishedAwaitingResume ? "break" : "focus";

  // Focus countdown is derived from Convex's focusedDurationSeconds (already
  // accounts for pauses/AFK/reload) plus any manual +60/-60 adjustment, so it
  // survives a page reload without any local persistence of its own.
  const focusAdjustSeconds = session?.focusAdjustSeconds ?? 0;
  const focusPhaseStartSeconds = session?.focusPhaseStartSeconds ?? 0;
  const currentPhaseFocusedSeconds = Math.max(
    0,
    localFocusedDurationSeconds - focusPhaseStartSeconds,
  );
  // While awaiting resume after a break, resumeSession hasn't run yet, so
  // session.focusAdjustSeconds still holds the PREVIOUS focus phase's
  // leftover +60/-60 total (only reset server-side once the user actually
  // presses play) — showing that stale value here made the "ready to start"
  // display read e.g. 2:00 instead of 25:00 if the prior phase had been
  // adjusted down. The upcoming phase always starts at a clean baseline.
  const focusSecondsLeft = breakFinishedAwaitingResume
    ? FOCUS_SECONDS
    : Math.max(0, FOCUS_SECONDS + focusAdjustSeconds - Math.floor(currentPhaseFocusedSeconds));

  // Break isn't time-tracked in Convex (no XP accrues on break, and breaks
  // aren't meant to survive a reload) — this remains a local-only countdown,
  // reset to a fresh BREAK_SECONDS whenever we detect a new break starting.
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(BREAK_SECONDS);
  const [isBreakRunning, setIsBreakRunning] = useState(false);
  const wasOnBreakRef = useRef(false);
  useEffect(() => {
    if (isOnBreak && !wasOnBreakRef.current) {
      setBreakSecondsLeft(BREAK_SECONDS);
      setIsBreakRunning(false);
      setBreakFinishedAwaitingResume(false);
    }
    if (!isOnBreak) setBreakFinishedAwaitingResume(false);
    wasOnBreakRef.current = isOnBreak;
  }, [isOnBreak]);

  const phaseSecondsLeft = pomodoroPhase === "focus" ? focusSecondsLeft : breakSecondsLeft;

  useEffect(() => {
    // Only the owner runs the local pomodoro state machine — a spectator's
    // countdown is unrelated to the actual session and must never pause it.
    if (!isOwn) return;
    if (pomodoroPhase === "break") {
      if (!isBreakRunning) return;
      const id = setInterval(() => {
        setBreakSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(id);
    }
  }, [isBreakRunning, pomodoroPhase, isOwn]);

  // ── Spectator elapsed-time ticker ──
  // Non-owners see a plain elapsed-time counter (mirrors Convex's
  // focusedDurationSeconds), never a pomodoro countdown that could affect the
  // owner's session.
  const [spectatorElapsed, setSpectatorElapsed] = useState(0);

  useEffect(() => {
    if (isOwn || !session) return;
    setSpectatorElapsed(session.focusedDurationSeconds);
  }, [isOwn, session, session?.focusedDurationSeconds]);

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
  // Only the live->break edge is driven from focusSecondsLeft; guard against
  // re-firing while already paused/transitioning (isRunning flips false as
  // soon as the pause mutation above resolves).
  if (pomodoroPhase === "focus" && !isRunning) return;

  const sid = sessionIdRef.current;
  playPhaseEndChime(pomodoroPhase === "focus" ? "break" : "focus");

  if (pomodoroPhase === "focus") {
    // pause when focus ends — isOnBreak (derived from the resulting pause
    // interval's reason) flips the phase to "break" once Convex updates
    if (sid) {
      pauseMutation({
        sessionId: sid,
        reason: "break_started",
      }).catch(console.error);
    }
  } else {
    // break ended — flip the display to "focus" (25:00, ready to go) but DO
    // NOT auto-resume the underlying Convex session; the user still presses
    // play, same as before
    setBreakFinishedAwaitingResume(true);
    setIsBreakRunning(false);
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

  // ── Screen Wake Lock ──
  // Keep the phone's screen awake while the timer is actually counting
  // (focus running, or a break the user started). Without this, mobile
  // screens auto-lock after ~30s–2min of no touch, the browser suspends JS,
  // heartbeats stop, and the stale-session cron auto-pauses the session
  // after 5 minutes — resumable, but the timer stops accruing. The lock
  // is auto-released by the browser when the tab is hidden or the user locks
  // the phone manually, so re-acquire on visibilitychange when we return.
  const holdWakeLock = isOwn && (isRunning || (pomodoroPhase === "break" && isBreakRunning));
  useEffect(() => {
    if (!holdWakeLock) return;
    if (!("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const acquired = await navigator.wakeLock.request("screen");
        if (cancelled) {
          acquired.release().catch(() => {});
        } else {
          lock = acquired;
        }
      } catch (err) {
        // NotAllowedError (e.g. battery saver) — non-fatal, session just
        // falls back to the existing foreground-ping + recovery behavior.
        console.warn("Screen wake lock unavailable:", err);
      }
    };

    acquire();
    const onVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      lock?.release().catch(() => {});
    };
  }, [holdWakeLock]);

  // Tab switching intentionally does NOT trigger AFK — only a prolonged
  // absence (heartbeats going silent, e.g. the browser tab is closed/crashed
  // or a mobile OS suspends it) does, via the server-side cleanupStaleSessions
  // cron (see convex/sessionJobs.ts) after STALE_THRESHOLD_MS of missed
  // heartbeats.
  //
  // The page itself must never show/sit in "afk" while it's actually open:
  // if the session is already afk when this page mounts (or becomes visible
  // again — e.g. the laptop was asleep with the tab open, heartbeats lapsed,
  // the cron marked it afk, then the laptop wakes with the page still there),
  // immediately resolve it to paused rather than waiting for the user to
  // notice and press play.
  useEffect(() => {
    if (!isOwn || !sessionId) return;

    const resolveAfkIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (session?.status !== "afk") return;
      returnFromAfkMutation({ sessionId, toStatus: "paused" }).catch(console.error);
    };

    resolveAfkIfVisible();
    document.addEventListener("visibilitychange", resolveAfkIfVisible);
    return () => document.removeEventListener("visibilitychange", resolveAfkIfVisible);
  }, [isOwn, sessionId, session?.status, returnFromAfkMutation]);

  // ── Auto-redirect for already-completed+synced sessions (e.g. page refresh) ──
  const sessionStatus = session?.status;
  useEffect(() => {
    if (sessionStatus === "completed" && sessionSynced && sessionId && !isSyncing) {
      // Remove the completed timer page from the history entry. Otherwise,
      // pressing Back from the summary returns here and immediately redirects
      // to the summary again.
      router.replace(`/goals/${goalId}/session/${sessionId}/reflection`);
    }
  }, [sessionStatus, sessionSynced, sessionId, goalId, isSyncing, router]);

  // ── Recover from a session the server abandoned while we were away ──
  // If cleanupStaleSessions (Convex cron) marked this session completed —
  // "pause_timeout" when it sat paused for over 24h (including sessions the
  // cron auto-paused after heartbeats went silent), or "heartbeat_timeout"
  // from sessions killed by the older cron behavior — isActive flips to
  // false and every control (play, discard, finish) starts no-op'ing
  // silently, since they all guard on `isActive`. Detect that exact
  // signature (interruptionReason set only by the cron, never by user
  // actions) and finish the job client-side instead of leaving a dead screen:
  // sync it to Django as abandoned and route back to the goal.
  useEffect(() => {
    if (!isOwn || !session || !sessionId) return;
    if (session.status !== "completed") return;
    if (
      session.interruptionReason !== "heartbeat_timeout" &&
      session.interruptionReason !== "pause_timeout"
    )
      return;
    if (sessionSynced || isSyncing) return;

    let cancelled = false;

    (async () => {
      setIsSyncing(true);
      try {
        const finalStats: SessionFinalStats = {
          endedAt: session.endedAt ?? Date.now(),
          totalDurationSeconds: session.totalDurationSeconds,
          focusedDurationSeconds: session.focusedDurationSeconds,
          xpTotal: session.xpTotal,
          xpBreakdown: session.xpBreakdown,
        };
        await syncSessionToDjango(sessionId, finalStats, "abandoned");
        await markSyncedMutation({ sessionId });
      } catch (err) {
        console.error("Failed to sync stale-abandoned session to Django:", err);
      } finally {
        if (!cancelled) {
          toast.info(
            "Your session ended because the app was inactive for too long. It's been saved as abandoned.",
          );
          router.push(isEmptySession ? "/goals" : `/goals/${goalId}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isOwn,
    session,
    sessionId,
    sessionSynced,
    isSyncing,
    goalId,
    isEmptySession,
    router,
    markSyncedMutation,
  ]);

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
    } else if (isAfk) {
      // AFK always lands on paused, never straight back to live — the user
      // must explicitly press play again to actually resume ticking.
      await returnFromAfkMutation({ sessionId, toStatus: "paused" });
    } else if (isPaused) {
      await resumeMutation({ sessionId });
      posthog.capture("session_resumed", { session_id: sessionId, goal_id: goalId });
      // isOnBreak flips false once Convex updates, which also clears
      // breakFinishedAwaitingResume and resets focusAdjustSeconds server-side.
    }
  }, [
    isRunning,
    isAfk,
    isPaused,
    isActive,
    sessionId,
    goalId,
    pauseMutation,
    returnFromAfkMutation,
    resumeMutation,
  ]);

  // A logged session changes the goal's XP/session totals, the user's own
  // XP/streak, and can surface as a new feed post — invalidate every cache
  // that derives from those rather than letting them serve stale data until
  // their staleTime window happens to expire on its own.
  const invalidateAfterSessionSync = useCallback(() => {
    if (!isEmptySession) {
      // Partial key match also covers ["goal", goalId, "sessions"].
      queryClient.invalidateQueries({ queryKey: ["goal", goalId] });
    }
    // Partial key match also covers ["goals", "sidebar", username].
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
    if (me?.username) {
      queryClient.invalidateQueries({
        queryKey: ["user-profile-widget", me.username],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile-stats", me.username],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile-posts", me.username],
      });
    }
  }, [queryClient, goalId, isEmptySession, me?.username]);

  const handleFinish = useCallback(async () => {
    if (!sessionId || !isActive || isSyncing) return;
    setIsSyncing(true);

    try {
      const finalStats = await completeMutation({ sessionId, reason: "manual" });

      if (!sessionSynced) {
        try {
          await syncSessionToDjango(sessionId, finalStats, "manual");
          await markSyncedMutation({ sessionId });
          invalidateAfterSessionSync();
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
      // The completed timer must not remain directly behind the summary in
      // browser history, or Back creates a timer -> summary redirect loop.
      router.replace(`/goals/${goalId}/session/${sessionId}/reflection`);
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
    invalidateAfterSessionSync,
    router,
    goalId,
  ]);

  const handleDiscard = useCallback(async () => {
    if (!sessionId || !isActive || isSyncing) return;
    const ok = await confirm({
      title: "Discard session",
      message: "Discard this session? Your progress in it won't be saved.",
      confirmText: "Discard",
      destructive: true,
    });
    if (!ok) return;
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
          invalidateAfterSessionSync();
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
    invalidateAfterSessionSync,
    router,
    goalId,
    isEmptySession,
    confirm,
  ]);

  const handleSkipBreak = useCallback(async () => {
    if (!sessionId || isSkippingBreak) return;
    setIsSkippingBreak(true);
    try {
      await resumeMutation({ sessionId });
      // isOnBreak flips false once Convex updates, flipping the phase back
      // to "focus" with a fresh countdown.
    } catch (err) {
      console.error("Failed to skip break:", err);
    } finally {
      setIsSkippingBreak(false);
    }
    setIsBreakRunning(false);
  }, [sessionId, isSkippingBreak, resumeMutation]);

  const handleToggleBreak = useCallback(() => {
    setIsBreakRunning((prev) => !prev);
  }, []);

  const handleAdjustTime = useCallback(
    (deltaSeconds: number) => {
      if (pomodoroPhase === "break") {
        setBreakSecondsLeft((prev) => Math.max(0, prev + deltaSeconds));
        return;
      }
      if (!sessionId) return;
      void adjustFocusTimeMutation({ sessionId, deltaSeconds }).catch((err) => {
        console.error("Failed to adjust focus time:", err);
      });
    },
    [pomodoroPhase, sessionId, adjustFocusTimeMutation],
  );

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
      : DEFAULT_ACCENT_COLOR;
  const activityEmoji = isBreak ? "⏰" : (session?.activityEmoji ?? goalData.emoji);
  const activityLabel = isBreak
    ? "Break"
    : (session?.activityName ?? activityType ?? "Activity");
  const persistedSpectators = (session?.spectators ?? []).filter(
    (spectator) => spectator.lastSeenAt >= Date.now() - 60_000,
  );
  const activeSpectators =
    !isOwn &&
    me &&
    !persistedSpectators.some(
      (spectator) => spectator.userId === String(me.id),
    )
      ? [
          ...persistedSpectators,
          {
            userId: String(me.id),
            username: me.username,
            profilePicture: me.profile_picture ?? undefined,
            isNudged: false,
            lastSeenAt: Date.now(),
          },
        ]
      : persistedSpectators;

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden select-none">
      {/* Gradient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
        style={{ backgroundColor: categoryColor }}
      />

      {activeSpectators.length > 0 && (
        <aside
          className="absolute right-5 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3"
          aria-label={`${activeSpectators.length} ${
            activeSpectators.length === 1 ? "spectator" : "spectators"
          } watching`}
        >
          <div className="rounded-full border border-white/10 bg-gray-900/90 px-3 py-1 text-xs font-medium text-white/80 shadow-lg backdrop-blur">
            {activeSpectators.length}{" "}
            {activeSpectators.length === 1 ? "spectator" : "spectators"}
          </div>
          {activeSpectators.map((spectator) => (
            <Link
              key={spectator.userId}
              href={`/u/${encodeURIComponent(spectator.username)}`}
              className="relative h-12 w-12"
              title={`View ${spectator.username}'s profile`}
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white/20 bg-gray-800 shadow-lg shadow-black/40">
                <Image
                  src={spectator.profilePicture || "/default_pfp.png"}
                  alt={`${spectator.username}'s profile picture`}
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              {spectator.isNudged === true && (
                <span
                  className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-white text-base shadow-lg"
                  aria-label={`${spectator.username} nudged this session`}
                  title={`${spectator.username} nudged this session`}
                >
                  👋
                </span>
              )}
            </Link>
          ))}
        </aside>
      )}

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
        <div
          className="relative mb-8"
          data-onboarding={isOwn ? "session-timer" : undefined}
        >
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
        <div
          className="relative mb-12"
          ref={statsRef}
          data-onboarding={isOwn ? "session-xp" : undefined}
        >
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
            onNudgeChange={handleSpectatorNudgeChange}
            categoryColor={categoryColor}
            onClose={() => router.back()}
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            {/* Time adjustment — shown for both focus and break; kept in
                place (not unmounted) while paused so the layout doesn't
                shift, just faded out and made non-interactive */}
            <div
              className={`flex items-center gap-4 transition-opacity duration-200 ${
                (isBreak ? isBreakRunning : isRunning)
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
              aria-hidden={!(isBreak ? isBreakRunning : isRunning)}
            >
              <button
                onClick={() => handleAdjustTime(-60)}
                disabled={isSyncing}
                title="Subtract 60 seconds"
                className="h-16 w-16 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
              >
                -60
              </button>

              <button
                onClick={() => handleAdjustTime(60)}
                disabled={isSyncing}
                title="Add 60 seconds"
                className="h-16 w-16 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
              >
                +60
              </button>
            </div>

            {isBreak ? (
              <div
                className="flex items-center gap-4"
                data-onboarding="session-controls"
              >
                <button
                  onClick={handleSkipBreak}
                  disabled={isSyncing || isSkippingBreak}
                  className="h-14 w-24 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer disabled:opacity-40"
                >
                  {isSkippingBreak ? "Skipping…" : "Skip"}
                </button>

                <button
                  onClick={handleToggleBreak}
                  disabled={isSyncing}
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105 disabled:opacity-40"
                  style={{ backgroundColor: categoryColor }}
                  title={isBreakRunning ? "Pause" : "Start"}
                >
                  {isBreakRunning ? (
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
            ) : (
              <div
                className="flex items-center gap-4"
                data-onboarding="session-controls"
              >
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
            )}
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
