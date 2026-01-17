"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FireIcon,
  BoltIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
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
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data - replace with real data
  const goalData = {
    title: "Drawing Mandalorian",
    emoji: "🎨",
    category: "Drawing",
    categoryColor: "#4187a2",
  };

  const sessionData = {
    xpGained: 192,
    aspects: [
      { name: "Creativity", icon: <FaBrain className="w-5 h-5" />, xp: 19, color: "#4187a2", progress: 80 },
      { name: "Physique", icon: <FireIcon className="w-5 h-5" />, xp: 24, color: "#8d2e2e", progress: 40 },
      { name: "Energy", icon: <BoltIcon className="w-5 h-5" />, xp: 122, color: "#c49352", progress: 60 },
      { name: "Logic", icon: <FaHammer className="w-5 h-5" />, xp: 54, color: "#713599", progress: 55 },
      
      { name: "Social", icon: <UsersIcon className="w-5 h-5" />, xp: 32, color: "#31784e", progress: 50 },
    ],
    status: "Ongoing session",
    relatedGoal: "Programming",
  };

  // Timer logic
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

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNudge = () => {
    alert("Nudge sent! 👋");
  };

  const handleClose = () => {
    setIsRunning(false);
    router.push(`/goals`);
  };

  const handleDiscard = () => {
    if (confirm("Are you sure you want to discard this session?")) {
      router.push(`/goals`);
    }
  };

  if (!mounted) {
    return (
      <div className="h-screen w-full bg-gradient-to-b from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative flex overflow-hidden">
      {/* Background with categoryColor gradient and dark overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `${goalData.categoryColor}`
        }}
      ></div>
      <div className="absolute inset-0 bg-black/85"></div>

      {/* Main Content - Gets pushed when sidebar opens */}
      <div className={`relative z-10 flex-1 flex flex-col items-center justify-center p-8 transition-all duration-300 ease-in-out ${showDetails ? 'md:mr-[384px]' : ''}`}>
        {/* Goal Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-200 dark:text-gray-300 mb-8 text-center">
          {goalData.title}
        </h1>

        {/* Emoji and Category */}
        <div className="flex flex-col items-center mb-12">
          <div className="text-7xl mb-4">{goalData.emoji}</div>
          <p
            className="text-lg font-semibold"
            style={{ color: goalData.categoryColor }}
          >
            {goalData.category}
          </p>
        </div>

        {/* Timer Display */}
        <div className="text-8xl md:text-9xl font-bold text-gray-100 dark:text-gray-200 mb-16 tracking-tight">
          {formatTime(time)}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleNudge}
            className="px-8 py-4 cursor-pointer bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-2xl font-semibold transition-colors flex items-center gap-2"
          >
            Nudge 👋
          </button>
          <button
            onClick={handleClose}
            className="px-8 py-4 bg-cyan-600 dark:bg-cyan-700 hover:bg-cyan-500 dark:hover:bg-cyan-600 text-white rounded-2xl font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Right Sidebar Container with Toggle Button - Always visible */}
      <div className="fixed right-0 top-0 h-full flex z-50">
        {/* Sidebar Panel - Slides in/out */}
        <div
          className={`flex transition-transform duration-300 ease-in-out ${
            showDetails ? "translate-x-0" : "translate-x-full md:translate-x-[336px]"
          }`}
        >
          {/* Toggle Button - Always visible on the left edge */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-8 cursor-pointer h-full text-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
            style={{ backgroundColor: `${goalData.categoryColor}15` }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className={`w-6 h-6 transition-transform duration-300 ${showDetails ? "" : "rotate-180"}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>

          {/* Sidebar Content */}
          <div style={{ backgroundColor: `${goalData.categoryColor}10` }} className="w-[336px] backdrop-blur-sm flex flex-col overflow-hidden">
            {/* Content */}
            <div className="flex-1 overflow-y-auto py-8 px-6">
              {/* Related Goal & Status */}
              <p className="text-white/90 text-lg font-medium mb-6">
                {sessionData.relatedGoal} • <span className="text-white/90">{sessionData.status}</span>
              </p>

              {/* XP Gained */}
              <div className="text-center mb-16">
                <p style={{ color: goalData.categoryColor }} className="text-6xl font-bold mb-2">+{sessionData.xpGained}</p>
                <p className="text-gray-400 text-sm">XP gained this session</p>
              </div>

              {/* Aspect Breakdown */}
              <div className="space-y-8">
                {sessionData.aspects.map((aspect, index) => (
                  <div key={index} className="space-y-2" style={{ opacity: index === 0 ? 1 : 0.5 }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span style={{ color: aspect.color }}>{aspect.icon}</span>
                        <span className="text-gray-300 text-sm font-medium">{aspect.name}</span>
                      </div>
                      <span className="text-gray-400 text-sm font-semibold">{aspect.xp}XP</span>
                    </div>
                    <div className={`w-full bg-gray-700/50 rounded-full ${index===0 ? 'h-4' : 'h-2'} overflow-hidden`}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${aspect.progress}%`,
                          backgroundColor: aspect.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discard Button */}
            <div className="p-6 border-t border-gray-700/50">
              <button
                onClick={handleDiscard}
                className="w-full cursor-pointer bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 text-white py-4 rounded-2xl font-semibold transition-colors"
              >
                Discard session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {showDetails && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40 transition-opacity duration-300"
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}