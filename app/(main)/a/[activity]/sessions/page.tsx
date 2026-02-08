'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PlayIcon } from "@heroicons/react/24/solid";

import { mockUser } from "@/src/lib/mock/userData";
import SessionInfoPopup from "@/src/components/goals/SessionInfoPopup";


interface LiveSession {
  id: string;
  status: "live"|"break"|"paused";
  sessionNumber: number;
  activity: string;
  xpEarned: number;
  dateTime: string;
  duration: string;
  thumbnail?: string;
  emoji?: string;
}
interface Session {
  id: string;
  sessionNumber: number;
  activity: string;
  xpEarned: number;
  dateTime: string;
  duration: string;
  thumbnail?: string;
  emoji?: string;
}

const STATUS_CONFIG = {
  live: {
    label: "Ongoing",
    dot: "bg-green-500",
    text: "text-green-600",
    bg: "bg-green-500/10",
    pulse: true,
  },
  break: {
    label: "Break",
    dot: "bg-yellow-400",
    text: "text-yellow-600",
    bg: "bg-yellow-400/10",
    pulse: false,
  },
  paused: {
    label: "Paused",
    dot: "bg-red-500",
    text: "text-red-600",
    bg: "bg-red-500/10",
    pulse: false,
  },
} as const;

const LiveSessionItem: React.FC<LiveSession & { onClick?: () => void }> = ({
  status,
  sessionNumber,
  activity,
  dateTime,
  duration,
  onClick,
}) => {
  const s = STATUS_CONFIG[status];

  return (
    <div
      onClick={onClick}
      className="
        relative
        flex items-center justify-between
        p-4 rounded-2xl border
        bg-white dark:bg-dark-3
        cursor-pointer
        transition-colors
        hover:bg-gray-50 dark:hover:bg-dark-2
      "
      style={{ borderColor: "var(--border)" }}
    >
      {/* Status badge – top right */}
      <div
        className={`absolute top-3 right-3 flex items-center gap-2 px-2 py-0.5 rounded-full ${s.bg}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${s.dot} ${
            s.pulse ? "animate-pulse" : ""
          }`}
        />
        <span className={`text-xs font-semibold ${s.text}`}>
          {s.label}
        </span>
      </div>

      {/* Left content */}
      <div className="flex flex-col min-w-0 gap-1 pr-8">
        {/* Title */}
        <h3 className="font-semibold text-lg text-foreground dark:text-white truncate">
          Drawing Mandalorian
        </h3>

        {/* Session label */}
        <p
          className="text-sm font-bold truncate"
          style={{ color: "var(--alchemist-primary)" }}
        >
          @yucejuice
        </p>

        {/* Date */}
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {dateTime}
        </p>
      </div>

      {/* Right: duration */}
      <div className="flex-shrink-0 text-right">
        <div className="font-semibold text-lg text-foreground dark:text-white">
          {duration}
        </div>
      </div>
    </div>
  );
};





const SessionItem: React.FC<Session & { onClick?: () => void }> = ({
  sessionNumber,
  activity,
  xpEarned,
  dateTime,
  duration,
  thumbnail,
  emoji,
  onClick,
}) => {

  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
  return (
    <div
        onClick={onClick}
        className="flex items-center gap-4 p-4 bg-white dark:bg-dark-3 rounded-2xl border transition-shadow cursor-pointer"
        style={{ borderColor: "var(--border)" }}
      >

      <div className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-dark-3">
        {emoji ? (
          <span className="text-3xl">{emoji}</span>
        ) : thumbnail ? (
          <img src={thumbnail} alt="Session" className="w-full h-full object-cover" />
        ) : (
          <img
            src="https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/ske_20251115103836"
            alt="Session thumbnail"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg text-foreground dark:text-white">
          Drawing Mandalorian
        </h3>
        <p className="text-sm font-bold" style={{ color: "var(--alchemist-primary)" }}>
          Session {sessionNumber}
        </p>
        <p className="text-xs mt-1 font-medium" style={{ color: "var(--muted)" }}>
          {xpEarned} XP Earned • {dateTime}
        </p>
      </div>

      {/* Right side: duration + menu */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-semibold text-lg text-foreground dark:text-white">
            {duration}
          </div>
        </div>

      </div>
    </div>
  );
};

interface Session {
  id: string;
  sessionNumber: number;
  activity: string;
  xpEarned: number;
  dateTime: string;
  duration: string;
}

export default function ActivitySessionsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const goalId = params.goalId as string;

  // 👇 KEEP THIS — used later for fetch logic
  const type = searchParams.get("type") as "live" | "friends" | "recent";

  // mock reuse
  const sessions: Session[] = [
    {
      id: '1',
      sessionNumber: 8,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 23 Nov 2024',
      duration: '1:12:02',
    },
    {
      id: '2',
      sessionNumber: 7,
      activity: 'Drawing',
      xpEarned: 180,
      dateTime: '10:23 AM, 22 Nov 2024',
      duration: '1:05:30',
    },
    {
      id: '3',
      sessionNumber: 6,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 21 Nov 2024',
      duration: '1:12:02',
    },
    {
      id: '1',
      sessionNumber: 8,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 23 Nov 2024',
      duration: '1:12:02',
    },
    {
      id: '2',
      sessionNumber: 7,
      activity: 'Drawing',
      xpEarned: 180,
      dateTime: '10:23 AM, 22 Nov 2024',
      duration: '1:05:30',
    },
    {
      id: '3',
      sessionNumber: 6,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 21 Nov 2024',
      duration: '1:12:02',
    },
    {
      id: '1',
      sessionNumber: 8,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 23 Nov 2024',
      duration: '1:12:02',
    },
    {
      id: '2',
      sessionNumber: 7,
      activity: 'Drawing',
      xpEarned: 180,
      dateTime: '10:23 AM, 22 Nov 2024',
      duration: '1:05:30',
    },
    {
      id: '3',
      sessionNumber: 6,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 21 Nov 2024',
      duration: '1:12:02',
    },
    {
      id: '1',
      sessionNumber: 8,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 23 Nov 2024',
      duration: '1:12:02',
    },
    {
      id: '2',
      sessionNumber: 7,
      activity: 'Drawing',
      xpEarned: 180,
      dateTime: '10:23 AM, 22 Nov 2024',
      duration: '1:05:30',
    },
    {
      id: '3',
      sessionNumber: 6,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 21 Nov 2024',
      duration: '1:12:02',
    },
  ];

  const [isSessionPopupOpen, setIsSessionPopupOpen] = React.useState(false);
  const [selectedSession, setSelectedSession] = React.useState<Session | null>(null);

  const handleOpenSessionPopup = (session: Session) => {
    setSelectedSession(session);
    setIsSessionPopupOpen(true);
  };

  const handleStartActivity = () => {
    router.push(`/goals/${goalId}/session/new`);
  };

  return (
    <>
      <SessionInfoPopup
        isOpen={isSessionPopupOpen}
        onClose={() => setIsSessionPopupOpen(false)}
        sessionNumber={selectedSession?.sessionNumber ?? 0}
        dateText={selectedSession?.dateTime ?? ""}
        totalDuration={selectedSession?.duration ?? ""}
        xpEarned={selectedSession?.xpEarned ?? 0}
        focusedDuration={"--"}
        nudgeCount={0}
        nudgeAvatars={[]}
        activity={{
          name: selectedSession?.activity ?? "",
          emoji: "🎨",
          color: "var(--alchemist-primary)",
        }}
      />

      <div
        className="min-h-screen"
        style={{ backgroundColor: 'var(--background)' }}
      >
        {/* Header (same look, simplified) */}
        <div
          className="bg-white dark:bg-dark-2 sticky top-0 z-10 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <button
              className="p-2 -ml-2 cursor-pointer rounded-lg transition-colors"
              onClick={() => router.back()}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <h1 className="text-xl font-bold flex-1 ml-2 text-foreground dark:text-white">
              Drawing
            </h1>

            <button
              className="px-6 py-2 flex items-center justify-center rounded-lg font-medium text-white text-md transition-all active:scale-95 cursor-pointer"
              style={{ backgroundColor: 'var(--rookie-primary)' }}
              onClick={handleStartActivity}
            >
              Start Activity
              <PlayIcon className="w-4 h-4 ml-3" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* LIVE */}
          {type === "live" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sessions.map((session) => (
                <>
                <LiveSessionItem
                  key={session.id}
                  status="live"
                  {...session}
                  onClick={() => handleOpenSessionPopup(session)}
                />
                

                </>
              ))}
            </div>
          )}

          {/* FRIENDS / RECENT */}
          {(type === "friends" || type === "recent") && (
            <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
              {sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
