'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RadarChart from "@/src/components/RadarChart";
import AspectChip from '@/src/components/goals/AspectChip';
import { mockUser } from "@/src/lib/mock/userData";
import SessionInfoPopup from "@/src/components/goals/SessionInfoPopup";
import {BiDumbbell} from "react-icons/bi";
import CompleteGoalPopup from '@/src/components/goals/CompleteGoalPopup';
import { useEffect } from 'react';
import { supabase } from "@/src/lib/supabase";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import {

  BoltIcon,
  UsersIcon,
  PlayIcon,
  ClockIcon,
  PauseCircleIcon,
} from "@heroicons/react/24/solid";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { FaBrain, FaHammer } from "react-icons/fa";
import NewActivityModal from '@/src/components/goals/NewActivityModel';
import NewSessionPopup from '@/src/components/goals/NewSessionPopup';
import NewGoalModal from '@/src/components/goals/NewGoalModal';

interface Session {
  id: string;
  user?:{
    id: string;
    username: string;
  }| undefined;
  goalTitle:string;
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
import { GoalsService } from "@/src/lib/services/goals";


interface Activity {
  id: string;
  name: string;
  type: ActivityType;
}

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
      <p className="w-[17px] text-sm font-semibold text-left text-gray-600 dark:text-[var(--muted)]">
        {rank}
      </p>
    );
  };

 

  return (
    <div
      className="rounded-2xl border p-6 bg-white dark:bg-dark-2"
      style={{ borderColor: "var(--border)" }}
    >
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg ">
          Top Players for Drawing
        </h3>
        <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
          2220 Overall
        </p>

      </div>


      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {users.map((user, idx) => (
           <Link key={user.id} href={`/profile/${user.id}`}>
                  <div className={`flex ${user.isYou ? 'bg-gray-50 dark:bg-dark-2  ' : 'dark:bg-dark-1'} hover:bg-gray-50 dark:hover:bg-dark-2 cursor-pointer justify-between items-center w-full px-5 py-4 rounded-xl transition-all    border border-transparent hover:border-gray-200 dark:hover:border-[var(--border)]`}>
                    <div className="flex items-center gap-4">
                      <div className="w-5 flex justify-center">
                        <RankBadge rank={user.rank} />
                      </div>

                      <img
                        src={user.avatar}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                        alt={user.name}
                      />

                      <p className="text-base font-semibold dark:text-[var(--foreground)]">
                        {`${user.name} ${user.isYou ? "(You)" : ""}`} 
                      </p>
                    </div>

                    <p className="text-base font-semibold dark:text-[var(--foreground)]">
                      {user.totalXp.toLocaleString()} XP
                    </p>
                  </div>
                </Link>
        ))}
        {users.length === 0 && (
          <div className="flex-col w-full  justify-center items-center py-4">
            <RocketLaunchIcon className="w-16 h-16 mb-8 stroke-black opacity-20 dark:stroke-white mx-auto"/>
                <p className="text-base text-center font-semibold text-black opacity-20 dark:text-[var(--foreground)] mx-auto">
                  Be the first to try this activity!
                </p>
                </div>
          )}
      </div>
    </div>
  );
};



const formatLiveDuration = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

interface LiveSessionCardProps {
  username?: string;
  userProfile?: string;
  activityType?: string;
  activityEmoji?: string;
  status: "live" | "paused" | "completed";
  goalTitle?: string;
  totalDurationSeconds: number;
  onClick?: () => void;
}

const LiveSessionCard: React.FC<LiveSessionCardProps> = ({
  username,
  userProfile,
  activityType,
  activityEmoji,
  status,
  goalTitle,
  totalDurationSeconds,
  onClick,
}) => {
  const isPaused = status === "paused";
  const [elapsedSeconds, setElapsedSeconds] = useState(totalDurationSeconds);

  // Resync whenever Convex pushes a fresh elapsed value
  useEffect(() => {
    setElapsedSeconds(totalDurationSeconds);
  }, [totalDurationSeconds]);

  // Tick locally every second while live, so the timer doesn't stall between Convex updates
  useEffect(() => {
    if (isPaused) return;
    const ticker = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(ticker);
  }, [isPaused]);

  const accentColor =
    ACTIVITY_META[activityType as ActivityType]?.cssColorVar ??
    "var(--aspect-creativity)";
  const timerColor = isPaused ? "#f59e0b" : accentColor;
  const emoji = activityEmoji || "✦";
  const initial = username?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      onClick={onClick}
      className="
        flex flex-col items-center justify-center
        w-[148px] h-[195px] px-3.5 py-4
        rounded-[20px] border
        bg-white dark:bg-dark-2
        cursor-pointer
        transition-colors
        hover:bg-gray-50 dark:hover:bg-dark-3
      "
      style={{ borderColor: "var(--border)" }}
    >
      {/* Avatar with activity-emoji badge overlapping bottom-right */}
      <div className="relative w-14 h-14 mb-3 shrink-0">
        {userProfile ? (
          <img
            src={userProfile}
            alt={username ?? "User"}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center font-semibold text-lg bg-gray-200 dark:bg-dark-3 text-gray-600 dark:text-[var(--muted)]">
            {initial}
          </div>
        )}
        <div
          className="absolute -bottom-1 bg-opacity-50 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-white dark:border-dark-2"
          style={{ backgroundColor: `${accentColor}` }}
        >
          {emoji}
        </div>
      </div>

      {/* Title */}
      <p className="text-center text-[13px] font-semibold leading-tight line-clamp-2 text-foreground dark:text-[var(--foreground)]">
        {goalTitle || "Active Session"}
      </p>

      {/* Username */}
      {username && (
        <p
          className="mt-1 text-xs font-semibold truncate max-w-full"
          style={{ color: accentColor }}
        >
          @{username}
        </p>
      )}

      {/* Live elapsed timer */}
      <div
        className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-[10px]"
        style={{
          backgroundColor: `color-mix(in srgb, ${timerColor} 12%, transparent)`,
        }}
      >
        {isPaused ? (
          <PauseCircleIcon className="w-3.5 h-3.5" style={{ color: timerColor }} />
        ) : (
          <ClockIcon className="w-3.5 h-3.5" style={{ color: timerColor }} />
        )}
        <span
          className="text-[15px] font-extrabold tabular-nums"
          style={{ color: timerColor }}
        >
          {formatLiveDuration(elapsedSeconds)}
        </span>
      </div>
    </div>
  );
};






const SessionItem: React.FC<Session & { onClick?: () => void; accentColor?: string }> = ({
  sessionNumber,
  activity,
  goalTitle,
  xpEarned,
  dateTime,
  duration,
  thumbnail,
  emoji,
  onClick,
  accentColor = "var(--aspect-creativity)",
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
        className="flex items-center gap-4 p-4 bg-white dark:bg-dark-2 rounded-2xl border transition-shadow cursor-pointer"
        style={{ borderColor: "var(--border)" }}
      >

      <div className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-dark-3/50">
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
        <h3 className="font-semibold text-lg text-foreground dark:text-[var(--foreground)]">
          {goalTitle? goalTitle : `Free ${activity} Session`}
        </h3>
        <p className="text-sm font-bold" style={{ color: accentColor }}>
          Session {sessionNumber}
        </p>
        <p className="text-xs mt-1 font-medium" style={{ color: "var(--muted)" }}>
          {xpEarned} XP Earned • {dateTime}
          
        </p>
      </div>

      {/* Right side: duration + menu */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-semibold text-lg text-foreground dark:text-[var(--foreground)]">
            {duration}
          </div>
        </div>

      </div>
    </div>
  );
};



const FriendSessionItem: React.FC<Session & { onClick?: () => void; accentColor?: string }> = ({
  sessionNumber,
  goalTitle,
  user,
  xpEarned,
  dateTime,
  duration,
  thumbnail,
  emoji,
  onClick,
  accentColor = "var(--aspect-creativity)",
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
        className="flex items-center gap-4 p-4 bg-white dark:bg-dark-2 rounded-2xl border transition-shadow cursor-pointer"
        style={{ borderColor: "var(--border)" }}
      >

      <div className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-dark-3/50">
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
        <h3 className="font-semibold text-lg text-foreground dark:text-[var(--foreground)]">
          {goalTitle}
        </h3>
        <Link href={`/u/${user?.username}`} className="text-sm font-bold" style={{ color: accentColor }}>
        <p className="text-sm font-bold" style={{ color: accentColor }}>
          @{user?.username}
        </p>
        </Link>
        <p className="text-xs mt-1 font-medium" style={{ color: "var(--muted)" }}>
          {xpEarned} XP Earned • {dateTime}
        </p>
      </div>

      {/* Right side: duration + menu */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-semibold text-lg text-foreground dark:text-[var(--foreground)]">
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
      goalTitle:"Drawing mandalorian",
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 23 Nov 2024',
      duration: '1:12:02'
    }
   
  ],
  
  onBack = () => window.history.back(),
  onMore = () => console.log('More'),
}: ActivityDetailProps) {
  const params = useParams();
  const router = useRouter();
  const uid = params.activity as string;

  const handleStartActivity = () => {
    router.push(`/goals/${uid}/session/new`);
  };

  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);
  const [isNewSessionPopupOpen, setIsNewSessionPopupOpen] = useState(false);

  const handleSelectActivity = (activity: Activity) => {
    setIsNewActivityModalOpen(false);
    setIsNewSessionPopupOpen(false);
    // Navigate to session page with new session
    router.push(`/goals/${uid}/session/new?activity=${activity.id}`);
  };

  const handleGenerateNew = (query: string) => {
    console.log('Generate new activity:', query);
    setIsNewActivityModalOpen(false);
    // TODO: This page needs a goal ID to properly start a session with AI-generated activity
  };

  const handleStartDrawing = () => {
    setIsNewActivityModalOpen(false);
    router.push(`/goals/${uid}/session/new?activity=drawing`);
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



const [activityData, setActivityData] = useState<any>(null);
const [loading, setLoading] = useState(true);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;


const radarData = useMemo(() => {
  const dist = activityData?.xp_distribution || {};
  const physique = dist.physique ?? 0;
  const energy = dist.energy ?? 0;
  const logic = dist.logic ?? 0;
  const creativity = dist.creativity ?? 0;
  const social = dist.social ?? 0;

  // Shared fullMark across every aspect keeps the spokes on a single, equal scale.
  const fullMark = Math.max(physique, energy, logic, creativity, social, 10);

  return [
    { aspect: "Physique", value: physique, fullMark },
    { aspect: "Energy", value: energy, fullMark },
    { aspect: "Logic", value: logic, fullMark },
    { aspect: "Creativity", value: creativity, fullMark },
    { aspect: "Social", value: social, fullMark },
  ];
}, [activityData]);

const activityColor = activityData?.activity_type && ACTIVITY_META[activityData.activity_type as ActivityType]
  ? ACTIVITY_META[activityData.activity_type as ActivityType].cssColorVar
  : "#4f7df3";

const formatDuration = (seconds: number) => {
  if (!seconds) return "00:00:00";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const parseDuration = (dur: string): number => {
  const parts = dur.split(':').map(Number);
  return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
};

const formatTimeSpent = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

useEffect(() => {
  if (!uid) return;

  const fetchActivity = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/activities/${uid}/`);
      const data = await res.json();
      
      setActivityData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);

    }
  };

  fetchActivity();
}, [uid]);


const [friendsSessions, setFriendsSessions] = useState<any[]>([]);
const [sessionsLoading, setSessionsLoading] = useState(true);


useEffect(() => {
  if (!uid) return;

  const fetchFriendsSessions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
      const headers: HeadersInit = {};

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/a/${uid}/sessions/friends/`, {
        headers,
        credentials: "include",
      });
      const data = await res.json();

      const mapped = (data.results || []).map((s: any) => ({
        id: String(s.id),
        sessionNumber: s.session_number,
        goalTitle: s.goal_title,
        user:s.user,
        activity: s.activity?.name,
        xpEarned: s.xp_total,
        dateTime: new Date(s.started_at).toLocaleString(),
        duration: formatDuration(s.total_duration_seconds),
        emoji: s.activity?.emoji,
      }));

      setFriendsSessions(mapped);

    } catch (e) {
      console.error("Friends sessions error:", e);
    } finally {
      setSessionsLoading(false);
    }
  };

  fetchFriendsSessions();
}, [uid]);




const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);


useEffect(() => {
  if (!uid) return;

  const fetchLeaderboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {};

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/a/${uid}/leaderboard/`, {
        headers,
      });
            
      const data = await res.json();

      console.log("leaderboard raw:", data);
      // 🔥 map API → UI format
      const mapped = (data.leaderboard || []).map((item: any) => ({
        rank: item.rank,
        id: String(item.user.id),
        name: item.user.fullname,
        avatar: item.user.profile_picture,
        totalXp: item.total_xp,
        isYou: item.is_you,
      }));

      setLeaderboard(mapped);

    } catch (e) {
      console.error("Leaderboard error:", e);
    }
  };

  fetchLeaderboard();
}, [uid]);





const [mySessions, setMySessions] = useState<any[]>([]);



useEffect(() => {
  if (!uid) return;

  const fetchSessions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {};

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/a/${uid}/sessions/mine/`, {
        headers,
        credentials: "include",
      });

      const data = await res.json();
    const mapped = (data.results || []).map((s: any) => ({
      id: String(s.id),
      sessionNumber: s.session_number,
      goalTitle: s.goal_title,
      activity: s.activity?.name || "Activity",
      xpEarned: s.xp_total,
      dateTime: new Date(s.started_at).toLocaleString(),
      duration: formatDuration(s.total_duration_seconds),
      emoji: s.activity?.emoji,
    }));

      setMySessions(mapped);
      console.log("sessions raw:", data);

    } catch (e) {
      console.error("Sessions error:", e);
    }
  };

  fetchSessions();
}, [uid]);

 const liveSessions = useQuery(
  api.sessions.getLiveSessionsForActivity,
  uid
    ? {
        activityId: uid,
      }
    : "skip"
);




const [isModalOpen, setIsModalOpen] = useState(false);
    const handleCreateGoal = async (goal: {
    title: string;
    description: string;
    finishBy: string;
  }) => {
    try {
      await GoalsService.createGoal({
        title: goal.title,
        description: goal.description,
        finish_by: goal.finishBy,
      });

      setIsModalOpen(false);
      // Optionally redirect to goals page or refresh
      router.push('/goals');
    } catch (error) {
      console.error("Failed to create goal:", error);
      alert("Failed to create goal. Please try again.");
    }
  };

  const totalSessions = mySessions.length;
  const totalXP = mySessions.reduce((sum, s) => sum + s.xpEarned, 0);
  const totalTimeSpent = formatTimeSpent(
    mySessions.reduce((sum, s) => sum + parseDuration(s.duration), 0)
  );

  return (
    <>
      <style jsx global>{`
        .bg-dark-1 {
          background-color: var(--dark-1);
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
                color: activityColor,
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
            
            <h1 className="text-xl font-bold flex-1 ml-2 text-foreground dark:text-[var(--foreground)]">{activityData?.name || 'Activity'}</h1>
            
            <div ref={moreMenuRef} className="relative">
            <button
                className="w-full px-6 py-2 flex items-center justify-center rounded-lg font-medium text-white text-md transition-all active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: activityColor,
                }}
                onClick={handleOpenCompleteGoal}
              >

                Start {activityData?.name && activityData.name.length > 12
                  ? ` ${activityData.name.substring(0, 10)}...`
                  : activityData?.name || 'Activity'}
                <PlayIcon className="w-4 h-4 inline-block ml-4" />

              </button>

          </div>

          </div>
        </div>

        {/* Mobile Layout - Single Scroll */}
        <div className="block lg:hidden px-6 py-6 dark:bg-dark-1">
          {/* Stats */}
<div className="mb-6 flex justify-around bg-white dark:bg-dark-2 rounded-2xl p-4 border" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Time Spent</span>
              <span className="text-lg font-bold text-foreground dark:text-[var(--foreground)]">{totalTimeSpent}</span>
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

            <div className="flex flex-col items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>XP gained</span>
              <span className="text-lg font-bold text-foreground dark:text-[var(--foreground)]">{totalXP}</span>
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
                <span className="text-md font-semibold text-foreground dark:text-[var(--foreground)]">+{stats.likes}</span>
              </div>
            </div>
          </div>
         

          {/* Description */}
          <p className="text-base mb-6 text-foreground dark:text-[var(--foreground)]">
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

<h2 className="text-xl font-bold my-4 text-foreground dark:text-[var(--foreground)]">Your Recent Sessions</h2>
            <div className="space-y-3">
            {todaySessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  accentColor={activityColor}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
            </div>


           <h2 className="text-xl font-bold my-4 text-foreground dark:text-[var(--foreground)]">Your Recent Sessions</h2>
            <div className="space-y-3">
            {todaySessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  accentColor={activityColor}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
            </div>

            
        
        


        </div>

        {/* Desktop Layout - Two Column */}
        <div className="hidden lg:flex gap-6 px-6 py-6 dark:bg-dark-1">
          {/* Left Column - Main Content */}
          <div className="flex-1">

            <div className="mb-6 flex justify-around bg-white dark:bg-dark-2 rounded-2xl px-4 py-6 border" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col items-center justify-between">
              <span className="text-lg font-bold text-foreground dark:text-[var(--foreground)]">{totalTimeSpent}</span>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Time Spent</span>
            </div>

            <div className="w-px" style={{ backgroundColor: 'var(--border)' }} />

            <div className="flex flex-col items-center justify-between">

              <span className="text-lg font-bold text-foreground dark:text-[var(--foreground)]">{totalXP}</span>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>XP gained</span>
            </div>

            <div className="w-px" style={{ backgroundColor: 'var(--border)' }} />

<div className="flex flex-col items-center justify-between">

              <span className="text-lg font-bold text-foreground dark:text-[var(--foreground)]">{totalSessions}</span>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Sessions</span>
            </div>
          
            
         
          </div>
         


              {liveSessions && liveSessions.length > 0 && (
              <>
              <div className="flex justify-between">
            <h2 className="text-xl font-bold my-6 text-foreground dark:text-[var(--foreground)]">Currently Live</h2>
            <button className='bg-transparent font-medium text-sm cursor-pointer active:opacity-80 hover:opacity-90' style={{color: activityColor}}>
              View more →
            </button>
            </div>
            <div className="flex flex-wrap mb-2 gap-3">
                {liveSessions.map((session) => (
                  <LiveSessionCard
                    key={session._id}
                    status={session.status}
                    goalTitle={session.goalTitle}
                    activityType={session.activityType}
                    activityEmoji={session.activityEmoji}
                    username={session.username}
                    userProfile={session.userProfile}
                    totalDurationSeconds={session.totalDurationSeconds}
                    onClick={() =>
                      router.push(`/goals/${session.goalId}/session/${session._id}`)
                    }
                  />
                ))}
              </div>
              </>
              )}

{!sessionsLoading &&
  leaderboard.length === 0 &&
  mySessions.length === 0 &&
  friendsSessions.length === 0 && (
    <div
      className="flex flex-col items-center justify-center text-center py-24 px-6 my-6 rounded-2xl "
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex flex-col items-center text-center">
  <div className="text-5xl">🌱</div>

          <div className="h-3" />

          <h3 className="text-sm font-bold">
            No sessions yet
          </h3>

          <div className="h-1.5" />

          <p className="text-sm text-gray-500">
            Be the first to log a session for this activity.
          </p>
</div>
    </div>
)}

{!sessionsLoading && friendsSessions.length > 0 && (
            <>
            <div className="flex justify-between">
            <h2 className="text-xl font-bold my-6 text-foreground dark:text-[var(--foreground)]">Friends' Drawing Sessions</h2>
            <button className='bg-transparent font-medium text-sm cursor-pointer active:opacity-80 hover:opacity-90' style={{color: activityColor}}>
              View more →
            </button>
            </div>
            <div className="space-y-3">
            
                <div className="space-y-3">
                  {friendsSessions.map((session) => (
                    <FriendSessionItem
                      key={session.id}
                      {...session}
                      accentColor={activityColor}
                      onClick={() => handleOpenSessionPopup(session)}
                    />
                  ))}
                </div>
              
            </div>
            </>
            )}

{!sessionsLoading && mySessions.length > 0 && (
 

  <>
            <div className="flex justify-between">
            <h2 className="text-xl font-bold my-6 text-foreground dark:text-[var(--foreground)]">Your Sessions</h2>
            <button className='bg-transparent font-medium text-sm cursor-pointer active:opacity-80 hover:opacity-90' style={{color: activityColor}}>
              View more →
            </button>
            </div>
            <div className="space-y-3">
            {mySessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  accentColor={activityColor}
                  onClick={() => handleOpenSessionPopup(session)}
                />
                  ))}
             
            </div>


         
          </>
 )}
         
            </div>

          {/* Right Sidebar - Desktop Only */}
          <div style={{width:"450px"}} className="flex-shrink-0">
            <div className=" space-y-6 mb-6 bg-white dark:bg-dark-2 rounded-2xl p-6 border" style={{ borderColor: 'var(--border)' }}>
              
              <div className="w-full h-[220px]">
                <RadarChart
                  data={radarData}
                  masteryTitle={user.masteryTitle}
                  username={user.username}
                  color={activityColor}
                />
              </div>

               {/* Aspect Chips */}
              <div>
               
                <div className="flex  justify-around gap-2">
                  <AspectChip icon={<BiDumbbell className="w-4 h-4" />} value={activityData?.xp_distribution.physique} tint="physique" />
                  <AspectChip icon={<BoltIcon className="w-4 h-4" />} value={activityData?.xp_distribution.energy} tint="energy" />
                  <AspectChip icon={<UsersIcon className="w-4 h-4" />} value={activityData?.xp_distribution.social} tint="social" />
                  <AspectChip icon={<FaBrain className="w-4 h-4" />} value={activityData?.xp_distribution.creativity} tint="creativity" />
                  <AspectChip icon={<FaHammer className="w-4 h-4" />} value={activityData?.xp_distribution.logic} tint="logic" />
                </div>
              </div>
              




              

              {/* Description */}

                <p className="text-md text-foreground dark:text-[var(--foreground)]">
                  {activityData?.description}
                </p>


             

              {/* Complete Goal Button */}

             

            </div>
           <ActivityLeaderboard users={leaderboard} />
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