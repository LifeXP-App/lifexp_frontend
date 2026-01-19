'use client';

import React, { useState } from 'react';
import RadarChart from "@/src/components/RadarChart";
import AspectChip from '@/src/components/goals/AspectChip';
import { mockUser } from "@/src/lib/mock/userData";
import {
  FireIcon,
  BoltIcon,
  UsersIcon,
  PlayIcon,
} from "@heroicons/react/24/solid";
import { FaBrain, FaHammer } from "react-icons/fa";
import ActivitySelectButton from '@/src/components/goals/ActivityResult';
interface Session {
  id: string;
  sessionNumber: number;
  activity: string;
  xpEarned: number;
  time: string;
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
  yesterdaySessions?: Session[];
  thisWeekSessions?: Session[];
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

const relevantActivities: Activity[] = [
  { id: "r1", name: "Workout", type: "physique" },
  { id: "r2", name: "Cardio", type: "energy" },
  { id: "r3", name: "Deep Work", type: "logic" },
];

const otherActivities: Activity[] = [
  { id: "o1", name: "Drawing", type: "creativity" },
  { id: "o2", name: "Networking", type: "social" },
  { id: "o3", name: "Studying", type: "logic" },
];


const SessionItem: React.FC<Session> = ({ 
  sessionNumber, 
  activity, 
  xpEarned, 
  time, 
  duration,
  thumbnail,
  emoji
}) => (
  <div 
    className="flex items-center gap-4 p-4 bg-white dark:bg-dark-3 rounded-2xl border transition-shadow cursor-pointer"
    style={{ borderColor: 'var(--border)' }}
  >
    <div 
      className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-dark-3"
    >
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
      <h3 className="font-semibold text-lg text-foreground dark:text-white">Session {sessionNumber}</h3>
      <p className="text-sm font-bold" style={{ color: 'var(--alchemist-primary)' }}>{activity}</p>
      <p className="text-xs mt-1 font-medium" style={{ color: 'var(--muted)' }}>
        {xpEarned} XP Earned • {time}
      </p>
    </div>
    
    <div className="text-right">
      <div className="font-semibold text-lg text-foreground dark:text-white">{duration}</div>
    </div>
  </div>
);

/* ===========================
   NEW ACTIVITY MODAL
   =========================== */

interface NewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
  onGenerateNew: () => void;
  onStartDrawing: () => void;
}

function NewActivityModal({ isOpen, onClose, onSelectActivity, onGenerateNew, onStartDrawing }: NewActivityModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

 

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30  z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white dark:bg-dark-2 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Search */}
          <div className="p-5 pb-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activities..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border-0 bg-gray-100 dark:bg-dark-3 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 text-base transition-all"
              />
            </div>
          </div>

    

          {/* Recent Activity */}
          <div className="px-5 pb-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">Recent</h3>
             {relevantActivities.map((activity) => (
              <ActivitySelectButton
                key={activity.id}
                activity={activity}
                onSelect={onSelectActivity}
              />
            ))}
          </div>

          {/* Other Activities */}
          <div className="px-5 pb-3 space-y-2">
             <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">Relevent</h3>
            {otherActivities.map((activity) => (
    <ActivitySelectButton
      key={activity.id}
      activity={activity}
      onSelect={onSelectActivity}
    />))}
          </div>

          {/* Bottom Buttons */}
          <div className="p-5 pt-3 grid grid-cols-2 gap-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onGenerateNew}
              className="py-3 px-4 rounded-2xl font-semibold text-white bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 transition-all cursor-pointer text-sm"
            >
              Generate New
            </button>
            <button
              onClick={onStartDrawing}
              className="py-3 px-4 rounded-2xl font-semibold text-white transition-all cursor-pointer text-sm"
              style={{ backgroundColor: 'var(--rookie-primary)' }}
            >
              Start Drawing
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

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
      time: '10:23 AM',
      duration: '1:12:02'
    }
  ],
  yesterdaySessions = [
    {
      id: '2',
      sessionNumber: 7,
      activity: 'Drawing',
      xpEarned: 232,
      time: '10:23 AM',
      duration: '1:12:02'
    },
    {
      id: '3',
      sessionNumber: 7,
      activity: 'Drawing',
      xpEarned: 232,
      time: '10:23 AM',
      duration: '1:12:02',
      emoji: '🎨'
    }
  ],
  thisWeekSessions = [
    {
      id: '4',
      sessionNumber: 6,
      activity: 'Drawing',
      xpEarned: 232,
      time: '10:23 AM',
      duration: '1:12:02'
    }
  ],
  onBack = () => window.history.back(),
  onMore = () => console.log('More'),
  onStartActivity = () => console.log('Start Activity'),
  onNewActivity = () => console.log('New Activity'),
  onCompleteGoal = () => console.log('Complete Goal')
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
            <div className="flex flex-wrap justify-around gap-2">
              <AspectChip icon={<FireIcon className="w-4 h-4" />} value={341} tint="physique" />
              <AspectChip icon={<BoltIcon className="w-4 h-4" />} value={432} tint="energy" />
              <AspectChip icon={<UsersIcon className="w-4 h-4" />} value={234} tint="social" />
              <AspectChip icon={<FaBrain className="w-4 h-4" />} value={324} tint="creativity" />
              <AspectChip icon={<FaHammer className="w-4 h-4" />} value={234} tint="logic" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:scale-95 cursor-pointer"
              style={{ 
                backgroundColor: 'var(--rookie-primary)',
              }}
              onClick={onStartActivity}
            >
              Start Drawing
            </button>
            
            <button
              className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:scale-95 cursor-pointer"
              style={{ 
                backgroundColor: '#4a4a4a',
              }}
              onClick={() => setIsNewActivityModalOpen(true)}
            >
              New Activity
            </button>
          </div>

          {/* Sessions - Today */}
          {todaySessions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-foreground dark:text-white">Today</h2>
              <div className="space-y-3">
                {todaySessions.map(session => (
                  <SessionItem key={session.id} {...session} />
                ))}
              </div>
            </div>
          )}

          {/* Sessions - Yesterday */}
          {yesterdaySessions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-foreground dark:text-white">Yesterday</h2>
              <div className="space-y-3">
                {yesterdaySessions.map(session => (
                  <SessionItem key={session.id} {...session} />
                ))}
              </div>
            </div>
          )}

          {/* Sessions - This Week */}
          {thisWeekSessions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-foreground dark:text-white">This week</h2>
              <div className="space-y-3">
                {thisWeekSessions.map(session => (
                  <SessionItem key={session.id} {...session} />
                ))}
              </div>
            </div>
          )}

          {/* Complete Goal Button - Mobile */}
          <button
            className="w-full py-3 rounded-2xl font-medium text-white text-md transition-all active:scale-95 cursor-pointer"
            style={{ 
              backgroundColor: 'var(--rookie-primary)',
            }}
            onClick={onCompleteGoal}
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
                className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:scale-95 cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--rookie-primary)',
                }}
                onClick={onStartActivity}
              >
                Start Drawing
              </button>
              
              <button
                className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:scale-95 cursor-pointer"
                style={{ 
                  backgroundColor: '#4a4a4a',
                }}
                onClick={() => setIsNewActivityModalOpen(true)}
              >
                New Activity
              </button>
            </div>

            {/* Sessions - Today */}
            {todaySessions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-foreground dark:text-white">Today</h2>
                <div className="space-y-3">
                  {todaySessions.map(session => (
                    <SessionItem key={session.id} {...session} />
                  ))}
                </div>
              </div>
            )}

            {/* Sessions - Yesterday */}
            {yesterdaySessions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-foreground dark:text-white">Yesterday</h2>
                <div className="space-y-3">
                  {yesterdaySessions.map(session => (
                    <SessionItem key={session.id} {...session} />
                  ))}
                </div>
              </div>
            )}

            {/* Sessions - This Week */}
            {thisWeekSessions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-foreground dark:text-white">This week</h2>
                <div className="space-y-3">
                  {thisWeekSessions.map(session => (
                    <SessionItem key={session.id} {...session} />
                  ))}
                </div>
              </div>
            )}
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
               
                <div className="flex flex-wrap justify-around gap-2">
                  <AspectChip icon={<FireIcon className="w-4 h-4" />} value={341} tint="physique" />
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
                onClick={onCompleteGoal}
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