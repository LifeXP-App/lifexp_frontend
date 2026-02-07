'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RadarChart from "@/src/components/RadarChart";
import AspectChip from '@/src/components/goals/AspectChip';
import { mockUser } from "@/src/lib/mock/userData";
import SessionInfoPopup from "@/src/components/goals/SessionInfoPopup";
import {BiDumbbell} from "react-icons/bi";
import CompleteGoalPopup from '@/src/components/goals/CompleteGoalPopup';

import {

  BoltIcon,
  UsersIcon,
  PlayIcon,
} from "@heroicons/react/24/solid";
import { FaBrain, FaHammer } from "react-icons/fa";
import NewActivityModal from '@/src/components/goals/NewActivityModel';
import NewSessionPopup from '@/src/components/goals/NewSessionPopup';
import NewGoalModal from '@/src/components/goals/NewGoalModal';

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

interface ActivityStats {
  timeSpent: string;
  leaderboard: number;
  likes: number;
  likeAvatars: string[];
}

interface AspectScore {
  physique: number;
  energy: number;
  logic: number;
  creativity: number;
  social: number;
}

interface ActivityDetailProps {
  goalCompleted?: boolean;
  title?: string;
  user?: typeof mockUser;
  radarData?: { aspect: string; value: number; fullMark: number }[];
  createdDate?: string;
  description?: string;
  stats?: ActivityStats;
  aspects?: AspectScore;
  todaySessions?: Session[];
  thisWeekSessions?: Session[];
  olderSessions?: Session[];
  onBack?: () => void;
  onMore?: () => void;
  onNewActivity?: () => void;
  onCompleteGoal?: () => void;
}

import { ACTIVITY_META, ActivityType } from "@/src/lib/types/activityMeta";
import Link from "next/link";


interface Activity {
  id: string;
  name: string;
  type: ActivityType;
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

 type LeaderboardUser = {
  rank: number;
  id: string;
  name: string;
  avatar?: string;
  totalXp: number;
  isYou?: boolean;
};



 const users: LeaderboardUser[] = [
    { rank: 1, id: "1", name: "Alex", totalXp: 5420 , avatar: "https://res.cloudinary.com/dfohn9dcz/image/upload/w_100,q_auto,f_auto/v1749738331/oydasgwd0mysponmm7xp.webp"},
    { rank: 2, id: "2", name: "You", totalXp: 4980, isYou: true,  avatar: "https://res.cloudinary.com/dfohn9dcz/image/upload/w_100,q_auto,f_auto/v1749738331/oydasgwd0mysponmm7xp.webp" },
    { rank: 3, id: "3", name: "Sam", totalXp: 4630, avatar: "https://res.cloudinary.com/dfohn9dcz/image/upload/w_100,q_auto,f_auto/v1749738331/oydasgwd0mysponmm7xp.webp" },
   { rank: 4, id: "3", name: "Sam", totalXp: 4630, avatar: "https://res.cloudinary.com/dfohn9dcz/image/upload/w_100,q_auto,f_auto/v1749738331/oydasgwd0mysponmm7xp.webp" },
    { rank:5, id: "3", name: "Sam", totalXp: 4630, avatar: "https://res.cloudinary.com/dfohn9dcz/image/upload/w_100,q_auto,f_auto/v1749738331/oydasgwd0mysponmm7xp.webp" },
     { rank: 6, id: "3", name: "Sam", totalXp: 4630, avatar: "https://res.cloudinary.com/dfohn9dcz/image/upload/w_100,q_auto,f_auto/v1749738331/oydasgwd0mysponmm7xp.webp" },
 { rank: 7, id: "3", name: "Sam", totalXp: 4630, avatar: "https://res.cloudinary.com/dfohn9dcz/image/upload/w_100,q_auto,f_auto/v1749738331/oydasgwd0mysponmm7xp.webp" },
  { rank: 8, id: "3", name: "Sam", totalXp: 4630, avatar: "https://res.cloudinary.com/dfohn9dcz/image/upload/w_100,q_auto,f_auto/v1749738331/oydasgwd0mysponmm7xp.webp" },
   { rank: 9, id: "3", name: "Sam", totalXp: 4630, avatar: "https://res.cloudinary.com/dfohn9dcz/image/upload/w_100,q_auto,f_auto/v1749738331/oydasgwd0mysponmm7xp.webp" },
    { rank: 10, id: "3", name: "Sam", totalXp: 4630, avatar: "https://res.cloudinary.com/dfohn9dcz/image/upload/w_100,q_auto,f_auto/v1749738331/oydasgwd0mysponmm7xp.webp" },
  ];

const ActivityLeaderboard: React.FC<{ users: LeaderboardUser[] }> = ({ users }) => {

  const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1)
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[17px] fill-[#D4AF37]"
          viewBox="0 0 576 512"
        >
          <path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6l277.2 0c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z" />
        </svg>
      );

    if (rank === 2)
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[17px] fill-[#C0C0C0]"
          viewBox="0 0 576 512"
        >
          <path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6l277.2 0c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z" />
        </svg>
      );

    if (rank === 3)
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-[17px] fill-[#CD7F32]"
          viewBox="0 0 576 512"
        >
          <path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6l277.2 0c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z" />
        </svg>
      );

    return (
      <p className="w-[17px] text-sm font-semibold text-left text-gray-600 dark:text-gray-400">
        {rank}
      </p>
    );
  };


  return (
    <div
      className="rounded-2xl border p-6 bg-white dark:bg-dark-3"
      style={{ borderColor: "var(--border)" }}
    >
      
        <h3 className="font-semibold text-lg mb-6">
          Top Players for Drawing
        </h3>



      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {users.map((user, idx) => (
           <Link key={user.id} href={`/profile/${user.id}`}>
                  <div className="flex hover:bg-gray-50 dark:hover:bg-dark-2 cursor-pointer justify-between items-center w-full px-5 py-4 rounded-xl transition-all  bg-white/50 dark:bg-dark-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-5 flex justify-center">
                        <RankBadge rank={user.rank} />
                      </div>

                      <img
                        src={user.avatar}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                        alt={user.name}
                      />

                      <p className="text-base font-semibold dark:text-white">
                        {user.name}
                      </p>
                    </div>

                    <p className="text-base font-semibold dark:text-gray-200">
                      {user.totalXp.toLocaleString()} XP
                    </p>
                  </div>
                </Link>
        ))}
      </div>
    </div>
  );
};



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




const SessionItemSmall: React.FC<Session & { onClick?: () => void }> = ({
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
       <h3 className="min-w-0 font-semibold text-md text-foreground dark:text-white truncate">
        Drawing Mandalorian
      </h3>
        <p className="text-sm font-bold" style={{ color: "var(--alchemist-primary)" }}>
          Session {sessionNumber}
        </p>
        <p className="text-xs mt-1 font-medium" style={{ color: "var(--muted)" }}>
         2 days ago
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


export default function ActivityDetailPage({
  goalCompleted = false,
  title = "Drawing",
  user = mockUser,
  radarData = [
    { aspect: "Physique", value: user.aspects.physique.level, fullMark: 12 },
    { aspect: "Energy", value: user.aspects.energy.level, fullMark: 12 },
    { aspect: "Logic", value: user.aspects.logic.level, fullMark: 12 },
    {
      aspect: "Creativity",
      value: user.aspects.creativity.level,
      fullMark: 12,
    },
    { aspect: "Social", value: user.aspects.social.level, fullMark: 12 },
  ],


  createdDate = "1 Jan 2026",
  description = "Wanted to get back to drawing and make some really good art of one of my favorite characters, so here it is",
  stats = {
    timeSpent: "2h 20m",
    leaderboard: 3490,
    likes: 24,
    likeAvatars: ['#171717', '#713599', '#4187a2']
  },
  aspects = {
    physique: 24,
    energy: 24,
    logic: 24,
    creativity: 24,
    social: 24
  },
  todaySessions = [
    {
      id: '1',
      sessionNumber: 8,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 23 Nov 2024',
      duration: '1:12:02'
    },
    {
      id: '2',
      sessionNumber: 7,
      activity: 'Drawing',
      xpEarned: 180,
      dateTime: '10:23 AM, 22 Nov 2024',
      duration: '1:05:30'
    },
    {
      id: '3',
      sessionNumber: 6,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 21 Nov 2024',
      duration: '1:12:02'
    }
  ],
  
  onBack = () => window.history.back(),
  onMore = () => console.log('More'),
}: ActivityDetailProps) {
  const params = useParams();
  const router = useRouter();
  const goalId = params.goalId as string;

  const handleStartActivity = () => {
    router.push(`/goals/${goalId}/session/new`);
  };

  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);
  const [isNewSessionPopupOpen, setIsNewSessionPopupOpen] = useState(false);

  const handleSelectActivity = (activity: Activity) => {
    setIsNewActivityModalOpen(false);
    setIsNewSessionPopupOpen(false);
    // Navigate to session page with new session
    router.push(`/goals/${goalId}/session/new?activity=${activity.id}`);
  };

  const handleGenerateNew = () => {
    console.log('Generate new activity');
    setIsNewActivityModalOpen(false);
  };

  const handleStartDrawing = () => {
    setIsNewActivityModalOpen(false);
    router.push(`/goals/${goalId}/session/new?activity=drawing`);
  };

  const handleOpenNewActivity = () => {
    setIsNewSessionPopupOpen(false);
    setIsNewActivityModalOpen(true);
  };


  const [isSessionPopupOpen, setIsSessionPopupOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const handleOpenSessionPopup = (session: Session) => {
    setSelectedSession(session);
    setIsSessionPopupOpen(true);
  };


  const [isCompleteGoalOpen, setIsCompleteGoalOpen] = useState(false);

  const handleOpenCompleteGoal = () => setIsCompleteGoalOpen(true);
  const handleCloseCompleteGoal = () => setIsCompleteGoalOpen(false);

  const handlePostAchievement = ({ title, description }: { title: string; description: string }) => {
    console.log("POST ACHIEVEMENT:", { title, description });

    // close after post
    setIsCompleteGoalOpen(false);
  };


    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


const [isModalOpen, setIsModalOpen] = useState(false);
    const handleCreateGoal = (goal: {
    title: string;
    description: string;
    finishBy: string;
  }) => {
    console.log("New goal created:", goal);
    // Add your logic here to save the goal
    setIsModalOpen(false);
  };

 
  return (
    <>
      <style jsx global>{`
        :root {
          --background: #f3f4f6;
          --foreground: #171717;
          --dark-1: #000000;
          --dark-2: #0c1017;
          --dark-3: #0e141c;
          --rookie-primary: #4168e2;
          --warrior-primary: #8d2e2e;
          --protagonist-primary: #c49352;
          --prodigy-primary: #713599;
          --alchemist-primary: #4187a2;
          --diplomat-primary: #31784e;
          --aspect-physique: #8d2e2e;
          --aspect-energy: #c49352;
          --aspect-logic: #713599;
          --aspect-creativity: #4187a2;
          --aspect-social: #31784e;
          --border: #e5e7eb;
          --muted: #9ca3af;
        }

        .dark {
          --background: #000000;
          --foreground: #ededed;
          --border: #262626;
        }

        .bg-dark-2 {
          background-color: var(--dark-2);
        }

        .bg-dark-3 {
          background-color: var(--dark-3);
        }

        .dark\\:bg-dark-2.dark {
          background-color: var(--dark-2);
        }

        .dark\\:bg-dark-3.dark {
          background-color: var(--dark-3);
        }

        .dark\\:hover\\:bg-dark-3:hover {
          background-color: var(--dark-3);
        }

        body {
          margin: 0;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      <div 
        className="min-h-screen"
        style={{ backgroundColor: 'var(--background)' }}
      >

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



        {/* Header */}
        <div className="bg-white dark:bg-dark-2 sticky top-0 z-10 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-6 py-4">
            <button 
              className="p-2 -ml-2 cursor-pointer  rounded-lg transition-colors"
              onClick={onBack}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <h1 className="text-xl font-bold flex-1 ml-2 text-foreground dark:text-white">{title}</h1>
            
            <div ref={moreMenuRef} className="relative">
            <button
                className="w-full px-6 py-2 flex items-center justify-center rounded-lg font-medium text-white text-md transition-all active:scale-95 cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--rookie-primary)',
                }}
                onClick={handleOpenCompleteGoal}
              >
                Start Activity
                <PlayIcon className="w-4 h-4 inline-block ml-4" />

              </button>

          </div>

          </div>
        </div>

        {/* Mobile Layout - Single Scroll */}
        <div className="block lg:hidden px-6 py-6">
          {/* Stats */}
<div className="mb-6 flex justify-around bg-white dark:bg-dark-2 rounded-2xl p-4 border" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Time Spent</span>
              <span className="text-lg font-bold text-foreground dark:text-white">{stats.timeSpent}</span>
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

            <div className="flex flex-col items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>XP gained</span>
              <span className="text-lg font-bold text-foreground dark:text-white">{stats.leaderboard}</span>
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

            <div className="flex  flex-col items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Likes</span>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {stats.likeAvatars.slice(0, 3).map((color, i) => (
                    <div 
                      key={i}
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-2"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-md font-semibold text-foreground dark:text-white">+{stats.likes}</span>
              </div>
            </div>
          </div>
         

          {/* Description */}
          <p className="text-base mb-6 text-foreground dark:text-white">
            {description}
          </p>

          
          

          {/* Aspect Chips */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted)' }}>
              Life Aspects
            </h3>
            <div className="flex  justify-around gap-2">
              <AspectChip icon={<BiDumbbell className="w-4 h-4" />} value={341} tint="physique" />
              <AspectChip icon={<BoltIcon className="w-4 h-4" />} value={432} tint="energy" />
              <AspectChip icon={<UsersIcon className="w-4 h-4" />} value={234} tint="social" />
              <AspectChip icon={<FaBrain className="w-4 h-4" />} value={324} tint="creativity" />
              <AspectChip icon={<FaHammer className="w-4 h-4" />} value={234} tint="logic" />
            </div>
          </div>

<h2 className="text-xl font-bold my-4 text-foreground dark:text-white">Your Recent Sessions</h2>
            <div className="space-y-3">
            {todaySessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
            </div>


           <h2 className="text-xl font-bold my-4 text-foreground dark:text-white">Your Recent Sessions</h2>
            <div className="space-y-3">
            {todaySessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
            </div>

            
        
        


        </div>

        {/* Desktop Layout - Two Column */}
        <div className="hidden lg:flex gap-6 px-6 py-6">
          {/* Left Column - Main Content */}
          <div className="flex-1">

            <div className="mb-6 flex justify-around bg-white dark:bg-dark-2 rounded-2xl px-4 py-6 border" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col items-center justify-between">
              <span className="text-lg font-bold text-foreground dark:text-white">{stats.timeSpent}</span>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Time Spent</span>
            </div>

            <div className="w-px" style={{ backgroundColor: 'var(--border)' }} />

            <div className="flex flex-col items-center justify-between">
              
              <span className="text-lg font-bold text-foreground dark:text-white">{stats.leaderboard}</span>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>XP gained</span>
            </div>

            <div className="w-px" style={{ backgroundColor: 'var(--border)' }} />

<div className="flex flex-col items-center justify-between">
              
              <span className="text-lg font-bold text-foreground dark:text-white">23</span>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Sessions</span>
            </div>
          
            
            <div className="w-px" style={{ backgroundColor: 'var(--border)' }} />

<div className="flex flex-col items-center justify-between">
              
              <span className="text-lg font-bold text-foreground dark:text-white">#{stats.leaderboard}</span>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Ranked</span>
            </div>
          </div>
         


              <div className="flex justify-between">
            <h2 className="text-xl font-bold my-6 text-foreground dark:text-white">Currently Live</h2>
            <button className='bg-transparent font-medium text-sm cursor-pointer active:opacity-80 hover:opacity-90' style={{color:"var(--rookie-primary)"}}>
              View more →
            </button>
            </div>
            <div className="grid grid-cols-2 mb-2 gap-3">
            {todaySessions.map((session) => (
                <LiveSessionItem
                  key={session.id}
                  status="paused"
                  {...session}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
            </div>


            <div className="flex justify-between">
            <h2 className="text-xl font-bold my-6 text-foreground dark:text-white">Friends' Drawing Sessions</h2>
            <button className='bg-transparent font-medium text-sm cursor-pointer active:opacity-80 hover:opacity-90' style={{color:"var(--rookie-primary)"}}>
              View more →
            </button>
            </div>
            <div className="space-y-3">
            {todaySessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
            </div>


            <div className="flex justify-between">
            <h2 className="text-xl font-bold my-6 text-foreground dark:text-white">Your Sessions</h2>
            <button className='bg-transparent font-medium text-sm cursor-pointer active:opacity-80 hover:opacity-90' style={{color:"var(--rookie-primary)"}}>
              View more →
            </button>
            </div>
            <div className="space-y-3">
            {todaySessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
            </div>


          </div>

          {/* Right Sidebar - Desktop Only */}
          <div style={{width:"450px"}} className="flex-shrink-0">
            <div className=" space-y-6 mb-6 bg-white dark:bg-dark-2 rounded-2xl p-6 border" style={{ borderColor: 'var(--border)' }}>
              
              <div className="w-full h-[220px]">
                <RadarChart
                  data={radarData}
                  masteryTitle={user.masteryTitle}
                  username={user.username}
                />
              </div>

               {/* Aspect Chips */}
              <div>
               
                <div className="flex  justify-around gap-2">
                  <AspectChip icon={<BiDumbbell className="w-4 h-4" />} value={341} tint="physique" />
                  <AspectChip icon={<BoltIcon className="w-4 h-4" />} value={432} tint="energy" />
                  <AspectChip icon={<UsersIcon className="w-4 h-4" />} value={234} tint="social" />
                  <AspectChip icon={<FaBrain className="w-4 h-4" />} value={324} tint="creativity" />
                  <AspectChip icon={<FaHammer className="w-4 h-4" />} value={234} tint="logic" />
                </div>
              </div>
              
              {/* Creation Date */}

              

              {/* Description */}

                <p className="text-md text-foreground dark:text-white">
                  {description}
                </p>


             

              {/* Complete Goal Button */}

             

            </div>
           <ActivityLeaderboard users={users} />
          </div>
          
        </div>
      </div>

      {/* New Session Popup - minimalistic */}
      <NewSessionPopup
        isOpen={isNewSessionPopupOpen}
        onClose={() => setIsNewSessionPopupOpen(false)}
        onSelectActivity={handleSelectActivity}
        onNewActivity={handleOpenNewActivity}
      />

      {/* New Activity Modal - full activity picker */}
      <NewActivityModal
        isOpen={isNewActivityModalOpen}
        onClose={() => setIsNewActivityModalOpen(false)}
        onSelectActivity={handleSelectActivity}
        onGenerateNew={handleGenerateNew}
        onStartDrawing={handleStartDrawing}
      />
    </>
  );
}