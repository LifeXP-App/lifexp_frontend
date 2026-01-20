"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

import AspectChip from "@/src/components/goals/AspectChip";
import { BoltIcon, UsersIcon } from "@heroicons/react/24/solid";
import { FaBrain, FaHammer } from "react-icons/fa";
import { BiDumbbell } from "react-icons/bi";

interface ActivityType {
  name: string;
  emoji: string;
  color: string;
}

interface AvatarType {
  color: string;
}

interface SessionInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;

  sessionNumber?: number;
  dateText?: string;

  coverImageUrl?: string;

  totalDuration?: string;
  xpEarned?: number;
  focusedDuration?: string;

  nudgeCount?: number;
  nudgeAvatars?: AvatarType[];

  activity?: ActivityType;
}

const SessionInfoPopup: React.FC<SessionInfoPopupProps> = ({
  isOpen,
  onClose,

  sessionNumber = 8,
  dateText = "10:20am, 23 January 2026",

  coverImageUrl = "https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/ske_20251115103836",

  totalDuration = "1h 19m",
  xpEarned = 1233,
  focusedDuration = "59m",

  nudgeCount = 24,
  nudgeAvatars = [{ color: "#c49352" }, { color: "#171717" }, { color: "#713599" }],

  activity = {
    name: "Drawing",
    emoji: "🎨",
    color: "#4187a2",
  },
}) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setIsAnimating(true);
    const t = setTimeout(() => setIsAnimating(false), 350);
    return () => clearTimeout(t);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <style jsx global>{`
     

        * {
          box-sizing: border-box;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Popup Card */}
        <div
          className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-white dark:border dark:border-gray-800 dark:bg-gray-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: isAnimating ? "scaleIn 0.2s ease-out" : "none",
          }}
        >
          {/* Close X */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-dark-3 transition-all cursor-pointer z-10"
            aria-label="Close"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Header */}
          <div className="px-6 pt-7 pb-4 text-center">
            <h1
              className="text-2xl font-bold mb-2"
              style={{
                animation: isAnimating ? "slideUp 0.25s ease-out 0.02s both" : "none",
                color: "var(--foreground)",
              }}
            >
              Session {sessionNumber}
            </h1>

            <p
              className="text-sm"
              style={{
                animation: isAnimating ? "slideUp 0.25s ease-out 0.05s both" : "none",
                color: "var(--muted)",
              }}
            >
              {dateText}
            </p>
          </div>

          {/* Cover Image (smaller) */}
          <div className="px-6 pb-5">
            <Image
              src={coverImageUrl}
              alt="Session cover"
              width={1200}
              height={600}
              className="w-full h-[180px] rounded-2xl object-cover"
              style={{
                animation: isAnimating ? "slideUp 0.25s ease-out 0.08s both" : "none",
              }}
            />
          </div>

          {/* Activity Badge */}
          <div
            className="px-6 pb-5 flex justify-center"
            style={{
              animation: isAnimating ? "slideUp 0.25s ease-out 0.1s both" : "none",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-dark-3"
              style={{
                border: "1px solid var(--border)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <span className="text-2xl">{activity.emoji}</span>
              <span className="font-semibold text-lg" style={{ color: activity.color }}>
                {activity.name}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div
            className="px-6 pb-6 grid grid-cols-2 gap-4"
            style={{
              animation: isAnimating ? "slideUp 0.25s ease-out 0.12s both" : "none",
            }}
          >
            <StatItem value={totalDuration} label="Total Duration" />
            <StatItem value={xpEarned.toString()} label="Total XP Earned" />
            <StatItem value={focusedDuration} label="Focused Duration" />

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {nudgeCount > 3 ? (
                  <>
                    <div className="flex -space-x-2">
                      {nudgeAvatars.slice(0, 3).map((avatar, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-dark-2"
                          style={{ backgroundColor: avatar.color }}
                        />
                      ))}
                    </div>
                    <span className="text-xl font-medium">+{nudgeCount - 3}</span>
                  </>
                ) : nudgeCount > 0 ? (
                  <div className="flex -space-x-2">
                    {nudgeAvatars.slice(0, 3).map((avatar, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-white dark:border-dark-2"
                        style={{ backgroundColor: avatar.color }}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-2xl font-bold">{nudgeCount}</span>
                )}
              </div>

              <div className="text-sm" style={{ color: "var(--muted)" }}>
                Nudges
              </div>
            </div>
          </div>

          {/* Aspect Chips (bottom) */}
          <div
            className="px-6 pb-7"
            style={{
              animation: isAnimating ? "slideUp 0.25s ease-out 0.14s both" : "none",
            }}
          >
            <div className="flex justify-around gap-2">
              <AspectChip icon={<BiDumbbell className="w-4 h-4" />} value={341} tint="physique" />
              <AspectChip icon={<BoltIcon className="w-4 h-4" />} value={432} tint="energy" />
              <AspectChip icon={<UsersIcon className="w-4 h-4" />} value={234} tint="social" />
              <AspectChip icon={<FaBrain className="w-4 h-4" />} value={324} tint="creativity" />
              <AspectChip icon={<FaHammer className="w-4 h-4" />} value={234} tint="logic" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

interface StatItemProps {
  value: string;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ value, label }) => (
  <div className="text-center">
    <div className="text-2xl font-bold mb-1">{value}</div>
    <div className="text-sm" style={{ color: "var(--muted)" }}>
      {label}
    </div>
  </div>
);

export default SessionInfoPopup;
