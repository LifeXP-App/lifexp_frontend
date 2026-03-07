"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { GoalsService } from "@/src/lib/services/goals";
import { useQuery } from "convex/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

// ── Helpers ──

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Types ──

type GoalData = {
  title: string;
  emoji: string;
  categoryName: string;
  categoryColor: string;
  daysTotal: number;
  daysCompleted: number;
};

// ── Page ──

interface ReflectionPageProps {
  params: Promise<{ goalId: string; sessionId: string }>;
}

export default function ReflectionPage({ params }: ReflectionPageProps) {
  const { goalId, sessionId } = use(params);
  const router = useRouter();

  // ── Convex session data (XP, durations, nudge count) ──
  const session = useQuery(api.sessions.getSession, {
    sessionId: sessionId as Id<"sessions">,
  });

  // ── Django goal data (days, progress, category) ──
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  useEffect(() => {
    GoalsService.getGoal(goalId)
      .then((goal) => {
        setGoalData({
          title: goal.title,
          emoji: goal.emoji,
          categoryName: goal.category?.name ?? "Activity",
          categoryColor: goal.category?.color ?? "#4187a2",
          daysTotal: goal.days_total,
          daysCompleted: goal.days_completed,
        });
      })
      .catch(console.error);
  }, [goalId]);

  // ── Animation ──
  const [isAnimating, setIsAnimating] = useState(true);
  const [progressWidth, setProgressWidth] = useState(0);

  const progressPercentage =
    goalData && goalData.daysTotal > 0
      ? Math.min(100, Math.round((goalData.daysCompleted / goalData.daysTotal) * 100))
      : 0;

  useEffect(() => {
    const animationTimer = setTimeout(() => setIsAnimating(false), 1000);
    const progressTimer = setTimeout(() => setProgressWidth(progressPercentage), 300);
    return () => {
      clearTimeout(animationTimer);
      clearTimeout(progressTimer);
    };
  }, [progressPercentage]);

  // ── Loading ──
  if (!session || !goalData) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundColor: "var(--background, #f3f4f6)" }}
      >
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Derived values ──
  const xpEarned = Math.floor(session.xpTotal);
  const totalDuration = formatDuration(Math.floor(session.totalDurationSeconds));
  const focusedDuration = formatDuration(Math.floor(session.focusedDurationSeconds));
  const nudgeCount = session.nudgeCount;
  const daysLeft = Math.max(0, goalData.daysTotal - goalData.daysCompleted);
  const dayNumber = goalData.daysCompleted;
  const { categoryColor, categoryName, emoji } = goalData;

  // Placeholder nudge avatar colors (no per-user data in Convex nudgeCount)
  const nudgeAvatarColors = ["#8d2e2e", "#c49352", "#4187a2"].slice(
    0,
    Math.min(nudgeCount, 3),
  );

  return (
    <>
      <style jsx global>{`
        :root {
          --background: #f3f4f6;
          --foreground: #171717;
          --border: #e5e7eb;
          --muted: #9ca3af;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: "DM Sans", -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div
        className="min-h-screen overflow-hidden w-full flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div
          className="w-full max-w-2xl rounded-3xl overflow-hidden"
          style={{
            animation: isAnimating ? "scaleIn 0.5s ease-out" : "none",
          }}
        >
          {/* Header */}
          <div className="px-6 pt-8 pb-4 text-center">
            <h1
              className="text-3xl font-bold mb-2"
              style={{
                animation: isAnimating
                  ? "slideUp 0.6s ease-out 0.1s both"
                  : "none",
                color: "var(--foreground)",
              }}
            >
              Day {dayNumber} Complete!
            </h1>
            <p
              className="text-sm"
              style={{
                animation: isAnimating
                  ? "slideUp 0.6s ease-out 0.2s both"
                  : "none",
                color: "var(--muted)",
              }}
            >
              Keep it up, we&apos;ll see you in the next session
            </p>
          </div>

          {/* Character Illustration */}
          <div className="px-6 pb-6">
            <Image
              src="https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/ske_20251115103836"
              alt="Character Illustration"
              width={1200}
              height={600}
              className="w-full h-70 rounded-2xl object-cover"
              style={{
                animation: isAnimating
                  ? "slideUp 0.6s ease-out 0.3s both"
                  : "none",
              }}
            />
          </div>

          {/* Activity Badge */}
          <div
            className="px-6 pb-6 flex justify-center"
            style={{
              animation: isAnimating
                ? "slideUp 0.6s ease-out 0.4s both"
                : "none",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white"
              style={{
                border: "1px solid var(--border)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <span className="text-2xl">{emoji}</span>
              <span
                className="font-semibold text-lg"
                style={{ color: categoryColor }}
              >
                {categoryName}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div
            className="px-6 pb-6 grid grid-cols-2 gap-4"
            style={{
              animation: isAnimating
                ? "slideUp 0.6s ease-out 0.5s both"
                : "none",
            }}
          >
            <StatItem value={totalDuration} label="Total Duration" />
            <StatItem value={String(xpEarned)} label="Total XP Earned" />
            <StatItem value={focusedDuration} label="Focused Duration" />

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {nudgeAvatarColors.length > 0 && (
                  <div className="flex -space-x-2">
                    {nudgeAvatarColors.map((color, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-white"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
                <span className="text-xl font-medium">+{nudgeCount}</span>
              </div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                Nudges
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className="px-6 pb-6"
            style={{
              animation: isAnimating
                ? "slideUp 0.6s ease-out 0.6s both"
                : "none",
            }}
          >
            <div
              className="relative h-6 rounded-full overflow-hidden"
              style={{ backgroundColor: "#e5e7eb" }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                style={{
                  backgroundColor: categoryColor,
                  width: `${progressWidth}%`,
                }}
              />
            </div>
            <div
              className="text-center mt-3 text-sm"
              style={{ color: "var(--muted)" }}
            >
              {daysLeft} days left
            </div>
          </div>

          {/* Done Button */}
          <div
            className="px-6 pb-8"
            style={{
              animation: isAnimating
                ? "slideUp 0.6s ease-out 0.7s both"
                : "none",
            }}
          >
            <button
              className="w-full py-4 rounded-2xl font-semibold text-white text-lg transition-all active:scale-[0.98]"
              style={{
                backgroundColor: categoryColor,
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.01)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              onClick={() => router.push(`/goals/${goalId}`)}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm" style={{ color: "var(--muted)" }}>
        {label}
      </div>
    </div>
  );
}
