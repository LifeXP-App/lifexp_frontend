"use client";

import {
  BoltIcon,
  ChevronUpIcon,
  FireIcon,
  PauseIcon,
  PlayIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { FaBrain, FaHammer } from "react-icons/fa";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/src/context/AuthContext";

interface SessionTimerProps {
  params: Promise<{
    goalId: string;
    sessionId: string;
  }>;
}

export default function SessionTimer({ params }: SessionTimerProps) {
  const { goalId, sessionId: sessionIdStr } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { me } = useAuth();

  const isNew = sessionIdStr === "new";
  const [createdSessionId, setCreatedSessionId] = useState<Id<"sessions"> | null>(null);
  const creatingRef = useRef(false);

  const sessionId = isNew ? createdSessionId : (sessionIdStr as Id<"sessions">);

  const [showStats, setShowStats] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);

  // ── Convex subscription & mutations ──
  const session = useQuery(
    api.sessions.getSession,
    sessionId ? { sessionId } : "skip"
  );
  const startMutation = useMutation(api.sessions.startSession);
  const heartbeatMutation = useMutation(api.sessions.heartbeat);
  const pauseMutation = useMutation(api.sessions.pauseSession);
  const resumeMutation = useMutation(api.sessions.resumeSession);
  const completeMutation = useMutation(api.sessions.completeSession);
  const abandonMutation = useMutation(api.sessions.abandonSession);

  const isRunning = session?.status === "live";
  const isPaused = session?.status === "paused";

  // ── Check for existing active session before creating ──
  const existingSession = useQuery(
    api.sessions.getActiveSession,
    isNew && me ? { userId: String(me.id) } : "skip"
  );

  // ── Create session when sessionId is "new" ──
  useEffect(() => {
    if (!isNew || createdSessionId || creatingRef.current || !me) return;
    // Wait for existingSession query to resolve (undefined = loading)
    if (existingSession === undefined) return;

    // If user already has an active/paused session, redirect to it
    if (existingSession) {
      router.replace(`/goals/${goalId}/session/${existingSession._id}`);
      return;
    }

    creatingRef.current = true;

    const activityId = searchParams.get("activity") || "unknown";

    // TODO: Fetch AI-calculated XP rates from Django before creating session
    // For now using placeholder rates
    const placeholderRates = {
      physique: 0.5,
      energy: 0.3,
      logic: 0.2,
      creativity: 0.8,
      social: 0.1,
    };

    startMutation({
      userId: String(me.id),
      goalId,
      activityId,
      rates: placeholderRates,
      deviceContext: { platform: "web" },
    })
      .then((id) => {
        setCreatedSessionId(id);
        router.replace(`/goals/${goalId}/session/${id}`);
      })
      .catch((err) => {
        console.error("Failed to start session:", err);
        creatingRef.current = false;
      });
  }, [isNew, createdSessionId, me, existingSession, goalId, searchParams, startMutation, router]);

  // TODO: Fetch goal data from Django REST API using goalId
  const goalData = {
    title: "Drawing Mandalorian",
    emoji: "🎨",
    category: "Drawing",
    categoryColor: "#4187a2",
  };

  // ── Sync display time from Convex (only jump forward) ──
  useEffect(() => {
    if (session) {
      setDisplayTime((prev) =>
        Math.max(prev, Math.floor(session.focusedDurationSeconds))
      );
    }
  }, [session?.focusedDurationSeconds]);

  // ── Local 1s tick for smooth display when live ──
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setDisplayTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // ── Heartbeat every 5s when live ──
  useEffect(() => {
    if (!isRunning || !sessionId) return;
    const interval = setInterval(() => {
      heartbeatMutation({ sessionId }).catch(console.error);
    }, 5000);
    heartbeatMutation({ sessionId }).catch(console.error); // immediate first beat
    return () => clearInterval(interval);
  }, [isRunning, sessionId, heartbeatMutation]);

  // ── Redirect on completion ──
  useEffect(() => {
    if (session?.status === "completed" && sessionId) {
      router.push(`/goals/${goalId}/session/${sessionId}/reflection`);
    }
  }, [session?.status, goalId, sessionId, router]);

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
      icon: <FireIcon className="w-4 h-4" />,
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
  const isActive = isRunning || isPaused;

  const handleToggle = useCallback(async () => {
    if (!sessionId || !isActive) return;
    if (isRunning) {
      await pauseMutation({ sessionId, reason: "user_initiated" });
    } else if (isPaused) {
      await resumeMutation({ sessionId });
    }
  }, [isRunning, isPaused, isActive, sessionId, pauseMutation, resumeMutation]);

  const handleFinish = useCallback(async () => {
    if (!sessionId || !isActive) return;
    await completeMutation({ sessionId, reason: "manual" });
  }, [sessionId, isActive, completeMutation]);

  const handleDiscard = useCallback(async () => {
    if (!sessionId || !isActive) return;
    if (confirm("Discard this session?")) {
      await abandonMutation({ sessionId, interruptionReason: "user_discarded" });
    }
  }, [sessionId, isActive, abandonMutation]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

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
    document.title = `${status} ${timeStr} - ${goalData.title}`;
    return () => {
      document.title = "LifeXP";
    };
  }, [displayTime, isRunning, goalData.title]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Loading state ──
  if (session === undefined) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden select-none">
      {/* Subtle gradient glow behind timer */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
        style={{ backgroundColor: goalData.categoryColor }}
      />

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-around py-20 px-6">
        {/* Goal info - compact */}
        <div className="flex items-center gap-3 mb-8">

          <div>
            <h1 className="text-5xl text-center text-white/40">
              {goalData.title}
            </h1>

          </div>
        </div>
        <div className="flex flex-col items-center gap-4 mb-12">
          <span className="text-7xl">{goalData.emoji}</span>
          <p style={{color:goalData.categoryColor}} className="text-xl font-bold">{goalData.category}</p>

        </div>

        {/* Timer */}
        <div className="relative mb-8">
          {/* Pulsing ring when running */}
          {isRunning && (
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{
                backgroundColor: goalData.categoryColor,
                animationDuration: "3s",
              }}
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
            style={{ color: goalData.categoryColor }}
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
            className="h-14 w-24 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer"
          >
            Discard
          </button>

          <button
            onClick={handleToggle}
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105"
            style={{ backgroundColor: goalData.categoryColor }}
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
            className="px-6 h-14 w-24 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer"
          >
            Finish
          </button>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2  items-center gap-4 text-gray-600 text-xs hidden md:flex">
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
