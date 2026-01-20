'use client';

import React, { useState } from 'react';
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
  xpGained: number;
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
  onStartActivity?: () => void;
  onNewActivity?: () => void;
  onCompleteGoal?: () => void;
}

import { ACTIVITY_META, ActivityType } from "@/src/lib/types/activityMeta";


interface Activity {
  id: string;
  name: string;
  type: ActivityType;
}



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
          Session {sessionNumber}
        </h3>
        <p className="text-sm font-bold" style={{ color: "var(--alchemist-primary)" }}>
          {activity}
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

        {/* Triple-dot dropdown */}
        <div  ref={menuRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
            className="w-9 h-9 cursor-pointer flex items-center justify-center rounded-full hover:opacity-70 active:opacity-40 transition-all"
          >
            {/* 3-dot SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="1.8" fill="currentColor" />
              <circle cx="12" cy="12" r="1.8" fill="currentColor" />
              <circle cx="12" cy="19" r="1.8" fill="currentColor" />
            </svg>
          </button>

          {open && (
              <div
                className="absolute left-0 top-10 w-44 bg-white dark:bg-dark-2 border rounded-md shadow-md overflow-hidden z-20"
                style={{ borderColor: "var(--border)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="w-full cursor-pointer text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    console.log("Repeat Session", sessionNumber);
                  }}
                >
                  Repeat Session
                </button>

                <div className="h-px" style={{ backgroundColor: "var(--border)" }} />

                <button
                  type="button"
                  className="w-full   cursor-pointer text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    console.log("Delete Session", sessionNumber);
                  }}
                >
                  Delete Session
                </button>
              </div>

          )}
        </div>
      </div>
    </div>
  );
};


export default function GoalDetailPage({
  title = "Drawing Mandalorian",
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
    xpGained: 3490,
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
    }
  ],
  thisWeekSessions = [
    {
      id: '2',
      sessionNumber: 7,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 23 Nov 2024',
      duration: '1:12:02'
    },
    {
      id: '3',
      sessionNumber: 7,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 22 Nov 2024',
      duration: '1:12:02',
      emoji: '🎨'
    }
  ],
  olderSessions = [
    {
      id: '4',
      sessionNumber: 6,
      activity: 'Drawing',
      xpEarned: 232,
      dateTime: '10:23 AM, 23 Nov 2024',
      duration: '1:12:02'
    }
  ],
  onBack = () => window.history.back(),
  onMore = () => console.log('More'),
  onStartActivity = () => console.log('Start Activity'),
}: ActivityDetailProps) {
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);

  const handleSelectActivity = (activity: Activity) => {
    console.log('Selected activity:', activity);
    setIsNewActivityModalOpen(false);
  };

  const handleGenerateNew = () => {
    console.log('Generate new activity');
    setIsNewActivityModalOpen(false);
  };

  const handleStartDrawing = () => {
    console.log('Start drawing');
    setIsNewActivityModalOpen(false);
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

        <CompleteGoalPopup
          isOpen={isCompleteGoalOpen}
          onClose={handleCloseCompleteGoal}
          onPost={handlePostAchievement}
          imageUrl="https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/ske_20251115103836"
          defaultTitle={title}
          defaultDescription={description}
          timeSpent={stats.timeSpent}
          xpGained={stats.xpGained}
          sessionsCount={todaySessions.length + thisWeekSessions.length + olderSessions.length}
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
            
            <button 
              className="p-2 cursor-pointer  rounded-lg transition-colors"
              onClick={onMore}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="18" r="1.5" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Layout - Single Scroll */}
        <div className="block lg:hidden px-6 py-6">
          {/* Creation Date */}
          <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
            Created on {createdDate}
          </p>

          {/* Description */}
          <p className="text-base mb-6 text-foreground dark:text-white">
            {description}
          </p>

          {/* Stats */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Time Spent</span>
              <span className="text-lg font-bold text-foreground dark:text-white">{stats.timeSpent}</span>
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>XP gained</span>
              <span className="text-lg font-bold text-foreground dark:text-white">{stats.xpGained}</span>
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

            <div className="flex items-center justify-between">
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

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:opacity-80  cursor-pointer"
              style={{ 
                backgroundColor: 'var(--rookie-primary)',
              }}
              onClick={onStartActivity}
            >
              Start Drawing
            </button>
            
            <button
              className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:opacity-80  cursor-pointer"
              style={{ 
                backgroundColor: '#4a4a4a',
              }}
              onClick={() => setIsNewActivityModalOpen(true)}
            >
              New Activity
            </button>
          </div>

           <h2 className="text-xl font-bold my-4 text-foreground dark:text-white">Today</h2>
            <div className="space-y-3">
            {todaySessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
            </div>

            
            {/* Sessions - Yesterday */}
            <h2 className="text-xl font-bold my-4 text-foreground dark:text-white">This Week</h2>
            <div className="space-y-3">
            {thisWeekSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
            </div>


            <h2 className="text-xl font-bold my-4 text-foreground dark:text-white">Older</h2>
            {/* Sessions - This Week */}
            <div className="space-y-3">
            {olderSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
              </div>

          {/* Complete Goal Button - Mobile */}
          <button
            className="w-full py-3 rounded-2xl font-medium text-white text-md transition-all active:scale-95 cursor-pointer"
            style={{ 
              backgroundColor: 'var(--rookie-primary)',
            }}
            onClick={handleOpenCompleteGoal}
          >
            Complete Goal
          </button>
        </div>

        {/* Desktop Layout - Two Column */}
        <div className="hidden lg:flex gap-6 px-6 py-6">
          {/* Left Column - Main Content */}
          <div className="flex-1">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button
                className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:opacity-80  cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--rookie-primary)',
                }}
                onClick={onStartActivity}
              >
                Start Drawing
              </button>
              
              <button
                className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:opacity-80 cursor-pointer"
                style={{ 
                  backgroundColor: '#4a4a4a',
                }}
                onClick={() => setIsNewActivityModalOpen(true)}
              >
                New Activity
              </button>
            </div>

            {/* Sessions - Today */}
            <h2 className="text-xl font-bold my-4 text-foreground dark:text-white">Today</h2>
            <div className="space-y-3">
            {todaySessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
            </div>

            
            {/* Sessions - Yesterday */}
            <h2 className="text-xl font-bold my-4 text-foreground dark:text-white">This Week</h2>
            <div className="space-y-3">
            {thisWeekSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  {...session}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
            </div>


            <h2 className="text-xl font-bold my-4 text-foreground dark:text-white">Older</h2>
            {/* Sessions - This Week */}
            <div className="space-y-3">
            {olderSessions.map((session) => (
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
            <div className="sticky top-24 space-y-6 bg-white dark:bg-dark-2 rounded-2xl p-6 border" style={{ borderColor: 'var(--border)' }}>
              
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

                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Created on {createdDate}
                </p>


              {/* Description */}

                <p className="text-md text-foreground dark:text-white">
                  {description}
                </p>


              {/* Stats */}
              <div className="space-y-4">
                {/* Time Spent */}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Time Spent</span>
                  <span className="text-lg font-bold text-foreground dark:text-white">{stats.timeSpent}</span>
                </div>

                <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

                {/* XP Gained */}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>XP gained</span>
                  <span className="text-lg font-bold text-foreground dark:text-white">{stats.xpGained}</span>
                </div>

                <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

                {/* Likes */}
                <div className="flex items-center justify-between">
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

             

              {/* Complete Goal Button */}
              <button
                className="w-full py-3 rounded-2xl font-medium text-white text-md transition-all active:scale-95 cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--rookie-primary)',
                }}
                onClick={handleOpenCompleteGoal}
              >
                Complete Goal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Activity Modal */}
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