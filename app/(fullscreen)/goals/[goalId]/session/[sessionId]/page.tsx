"use client";

import {
  BoltIcon,
  ChevronUpIcon,
  FireIcon,
  PauseIcon,
  PlayIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBrain, FaHammer } from "react-icons/fa";

interface SessionTimerProps {
  params: {
    goalId: string;
    sessionId: string;
  };
}

export default function SessionTimer({ params }: SessionTimerProps) {
  const router = useRouter();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data
  const goalData = {
    title: "Drawing Mandalorian",
    emoji: "🎨",
    category: "Drawing",
    categoryColor: "#4187a2",
  };

  const sessionData = {
    xpGained: 192,
    aspects: [
      {
        name: "Creativity",
        icon: <FaBrain className="w-4 h-4" />,
        xp: 19,
        color: "#4187a2",
      },
      {
        name: "Physique",
        icon: <FireIcon className="w-4 h-4" />,
        xp: 24,
        color: "#8d2e2e",
      },
      {
        name: "Energy",
        icon: <BoltIcon className="w-4 h-4" />,
        xp: 122,
        color: "#c49352",
      },
      {
        name: "Logic",
        icon: <FaHammer className="w-4 h-4" />,
        xp: 54,
        color: "#713599",
      },
      {
        name: "Social",
        icon: <UsersIcon className="w-4 h-4" />,
        xp: 32,
        color: "#31784e",
      },
    ],
  };

  useEffect(() => {
    if (!mounted) return;
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, mounted]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFinish = () => {
    setIsRunning(false);
    router.push(`/goals`);
  };

  const handleDiscard = () => {
    if (confirm("Discard this session?")) {
      router.push(`/goals`);
    }
  };

  if (!mounted) {
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
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        {/* Goal info - compact */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">{goalData.emoji}</span>
          <div>
            <h1 className="text-xl font-semibold text-white">
              {goalData.title}
            </h1>
            <p className="text-sm text-gray-500">{goalData.category}</p>
          </div>
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
            className="text-[120px] md:text-[160px] font-light text-white tracking-tighter tabular-nums"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatTime(time)}
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
            +{sessionData.xpGained} XP
          </span>
          <ChevronUpIcon
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showStats ? "rotate-180" : ""}`}
          />
        </button>

        {/* Stats dropdown */}
        {showStats && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 bg-gray-900/90 backdrop-blur-xl rounded-2xl p-5 border border-gray-800 min-w-[280px]">
            <div className="flex flex-wrap gap-3 justify-center">
              {sessionData.aspects.map((aspect, i) => (
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
            className="w-14 h-14 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Discard"
          >
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
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
            className="px-6 h-14 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-medium transition-colors cursor-pointer"
          >
            Finish
          </button>
        </div>
      </div>

      {/* Session duration label */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-600 text-sm">
        Session in progress
      </div>
    </div>
  );
}
