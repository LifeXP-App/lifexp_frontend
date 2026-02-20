'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RadarChart from "@/src/components/RadarChart";
import AspectChip from '@/src/components/goals/AspectChip';
import { mockUser } from "@/src/lib/mock/userData";
import SessionInfoPopup from "@/src/components/goals/SessionInfoPopup";
import { BiDumbbell } from "react-icons/bi";
import CompleteGoalPopup from '@/src/components/goals/CompleteGoalPopup';
import {
  BoltIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { FaBrain, FaHammer } from "react-icons/fa";
import NewActivityModal from '@/src/components/goals/NewActivityModel';
import NewSessionPopup from '@/src/components/goals/NewSessionPopup';
import NewGoalModal from '@/src/components/goals/NewGoalModal';
import { useGoal } from '@/src/lib/hooks/useGoals';
import { Session, GoalsService } from '@/src/lib/services/goals';
import { ACTIVITY_META, ActivityType } from "@/src/lib/types/activityMeta";

interface Activity {
  id: string;
  name: string;
  type: ActivityType;
}

// Separate component for SessionItem to avoid re-renders of the list
const SessionItem: React.FC<any & { onClick?: () => void }> = ({
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
          Session {sessionNumber || '?'}
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
        <div ref={menuRef} className="relative">
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
              className="absolute left-0 top-10 w-44 bg-white dark:bg-dark-2 border rounded-md shadow-lg overflow-hidden z-20"
              style={{ borderColor: "var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="w-full cursor-pointer font-medium text-left py-3 px-4 text-sm hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
                onClick={() => {
                  setOpen(false);
                  console.log("Repeat Session", sessionNumber);
                }}
              >
                Repeat Session
              </button>



              <button
                type="button"
                className="w-full   cursor-pointer font-medium text-left py-3 px-4 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
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


export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.goalId as string;

  const { goal, sessions, loading, error, refetch } = useGoal(goalId);

  // Helper to format duration seconds into HH:MM:SS
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartActivity = () => {
    const activityId = goal?.category ? 'Drawing' : 'drawing'; // Fallback
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

  const handleDeleteGoal = async () => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await GoalsService.deleteGoal(goalId);
        router.push('/goals');
      } catch (err) {
        console.error('Failed to delete goal:', err);
        alert('Failed to delete goal');
      }
    }
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

  const onBack = () => window.history.back();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <p className="text-foreground dark:text-white">Loading goal details...</p>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4" style={{ backgroundColor: 'var(--background)' }}>
        <p className="text-red-500">{error || 'Goal not found'}</p>
        <button onClick={onBack} className="text-blue-500 hover:underline">Go Back</button>
      </div>
    );
  }

  const goalCompleted = goal.status === 'completed';
  const description = `Status: ${goal.status}. ${goal.days_completed} / ${goal.days_total} days completed.`;

  // Calculate stats from sessions
  const totalDurationSeconds = sessions.reduce((acc, s) => acc + (s.total_duration_seconds || 0), 0);
  const totalXp = sessions.reduce((acc, s) => acc + s.xp_total, 0);

  // Group sessions
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(s => new Date(s.started_at).toDateString() === today);
  const otherSessions = sessions.filter(s => new Date(s.started_at).toDateString() !== today); // Simplified logic for demo

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
          sessionNumber={selectedSession ? Number(selectedSession.id) : 0} // using minimal mock ID logic
          dateText={selectedSession ? formatDate(selectedSession.started_at) : ""}
          totalDuration={selectedSession ? formatDuration(selectedSession.total_duration_seconds) : ""}
          xpEarned={selectedSession?.xp_total ?? 0}
          focusedDuration={selectedSession ? formatDuration(selectedSession.focused_duration_seconds) : "--"}
          nudgeCount={0}
          nudgeAvatars={[]}
          activity={{
            name: selectedSession?.activity?.name ?? "Activity",
            emoji: selectedSession?.activity?.emoji ?? "🎯",
            color: "var(--alchemist-primary)",
          }}
        />

        <CompleteGoalPopup
          isOpen={isCompleteGoalOpen}
          onClose={handleCloseCompleteGoal}
          onPost={handlePostAchievement}
          imageUrl="https://res.cloudinary.com/dfohn9dcz/image/upload/f_auto,q_auto,w_800,c_fill/v1/posts/user_7/ske_20251115103836"
          defaultTitle={goal.title}
          defaultDescription={description}
          timeSpent={formatDuration(totalDurationSeconds)}
          xpGained={totalXp}
          sessionsCount={sessions.length}
        />

        <NewGoalModal
          isOpen={isModalOpen}
          isEdit={true}
          goalCompleted={goalCompleted}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateGoal}
          initialGoal={{
            title: goal.title,
            description: description,
            finishBy: "2026-02-01", // Placeholder
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
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <h1 className="text-xl font-bold flex-1 ml-2 text-foreground dark:text-white">{goal.title}</h1>

            <div ref={moreMenuRef} className="relative">
              <button
                className="p-2 cursor-pointer rounded-lg transition-colors"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="6" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="18" r="1.5" fill="currentColor" />
                </svg>
              </button>

              {isMoreMenuOpen && (
                <div
                  className="absolute right-0 top-12 w-44 bg-white dark:bg-dark-2 border rounded-sm shadow-lg overflow-hidden z-50"
                  style={{ borderColor: "var(--border)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="w-full cursor-pointer text-left font-medium py-3 px-4 text-sm hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsModalOpen(true);
                    }}
                  >
                    Edit Goal
                  </button>



                  <button
                    type="button"
                    className="w-full cursor-pointer text-left font-medium py-3 px-4 text-sm hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      console.log("Reset Progress");
                    }}
                  >
                    Reset Progress
                  </button>



                  <button
                    type="button"
                    className="w-full cursor-pointer text-left font-medium py-3 px-4 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      handleDeleteGoal();
                    }}
                  >
                    Delete Goal
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Layout - Single Scroll */}
        <div className="block lg:hidden px-6 py-6">
          {/* Creation Date */}
          <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
            Created on {formatDate(goal.created_at)}
          </p>

          {/* Description */}
          <p className="text-base mb-6 text-foreground dark:text-white">
            {description}
          </p>

          {/* Stats */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Time Spent</span>
              <span className="text-lg font-bold text-foreground dark:text-white">{formatDuration(totalDurationSeconds)}</span>
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>XP gained</span>
              <span className="text-lg font-bold text-foreground dark:text-white">{totalXp}</span>
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Likes</span>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-2 bg-gray-400"
                  />
                </div>
                <span className="text-md font-semibold text-foreground dark:text-white">+0</span>
              </div>
            </div>
          </div>

          {/* Aspect Chips */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted)' }}>
              Life Aspects
            </h3>
            <div className="flex  justify-around gap-2">
              <AspectChip icon={<BiDumbbell className="w-4 h-4" />} value={0} tint="physique" />
              <AspectChip icon={<BoltIcon className="w-4 h-4" />} value={0} tint="energy" />
              <AspectChip icon={<UsersIcon className="w-4 h-4" />} value={0} tint="social" />
              <AspectChip icon={<FaBrain className="w-4 h-4" />} value={0} tint="creativity" />
              <AspectChip icon={<FaHammer className="w-4 h-4" />} value={0} tint="logic" />
            </div>
          </div>

          {/* Action Buttons */}
          {!goalCompleted && (
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button
                className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:opacity-80  cursor-pointer"
                style={{
                  backgroundColor: 'var(--rookie-primary)',
                }}
                onClick={handleStartActivity}
              >
                Start {goal.category?.name || 'Session'}
              </button>

              <button
                className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:opacity-80  cursor-pointer"
                style={{
                  backgroundColor: '#4a4a4a',
                }}
                onClick={() => handleOpenNewActivity()}
              >
                New Session
              </button>
            </div>
          )}


          <h2 className="text-xl font-bold my-4 text-foreground dark:text-white">Today</h2>
          <div className="space-y-3">
            {todaySessions.map((session) => (
              <SessionItem
                key={session.id}
                sessionNumber={Number(session.id) || 0} // Using ID as number fallback
                activity={session.activity?.name || 'Activity'}
                xpEarned={session.xp_total}
                dateTime={formatDate(session.started_at)}
                duration={formatDuration(session.total_duration_seconds)}
                emoji={session.activity?.emoji}
                onClick={() => handleOpenSessionPopup(session)}
              />
            ))}
            {todaySessions.length === 0 && <p className="text-sm text-gray-500">No sessions today</p>}
          </div>


          {/* Sessions - Earlier */}
          <h2 className="text-xl font-bold my-4 text-foreground dark:text-white">History</h2>
          <div className="space-y-3">
            {otherSessions.map((session) => (
              <SessionItem
                key={session.id}
                sessionNumber={Number(session.id) || 0}
                activity={session.activity?.name || 'Activity'}
                xpEarned={session.xp_total}
                dateTime={formatDate(session.started_at)}
                duration={formatDuration(session.total_duration_seconds)}
                emoji={session.activity?.emoji}
                onClick={() => handleOpenSessionPopup(session)}
              />
            ))}
            {otherSessions.length === 0 && <p className="text-sm text-gray-500">No past sessions</p>}
          </div>


          {/* Complete Goal Button - Mobile */}

          {!goalCompleted && (
            <div className="mb-6">
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
          )}
        </div>

        {/* Desktop Layout - Two Column */}
        <div className="hidden lg:flex gap-6 px-6 py-6">
          {/* Left Column - Main Content */}
          <div className="flex-1">
            {/* Action Buttons */}
            {!goalCompleted && (
              <div className="grid grid-cols-2 gap-3 mb-8">
                <button
                  className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:opacity-80  cursor-pointer"
                  style={{
                    backgroundColor: 'var(--rookie-primary)',
                  }}
                  onClick={handleStartActivity}
                >
                  Start {goal.category?.name || 'Session'}
                </button>

                <button
                  className="py-3 rounded-2xl text-md font-medium text-white text-base transition-all active:opacity-80 cursor-pointer"
                  style={{
                    backgroundColor: '#4a4a4a',
                  }}
                  onClick={() => setIsNewActivityModalOpen(true)}
                >
                  New Session
                </button>
              </div>
            )}


            {/* Sessions - Today */}
            <h2 className="text-xl font-bold my-4 text-foreground dark:text-white">Today</h2>
            <div className="space-y-3">
              {todaySessions.map((session) => (
                <SessionItem
                  key={session.id}
                  sessionNumber={Number(session.id) || 0}
                  activity={session.activity?.name || 'Activity'}
                  xpEarned={session.xp_total}
                  dateTime={formatDate(session.started_at)}
                  duration={formatDuration(session.total_duration_seconds)}
                  emoji={session.activity?.emoji}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
              {todaySessions.length === 0 && <p className="text-sm text-gray-500">No sessions today</p>}
            </div>


            {/* Sessions - History */}
            <h2 className="text-xl font-bold my-4 text-foreground dark:text-white">History</h2>
            <div className="space-y-3">
              {otherSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  sessionNumber={Number(session.id) || 0}
                  activity={session.activity?.name || 'Activity'}
                  xpEarned={session.xp_total}
                  dateTime={formatDate(session.started_at)}
                  duration={formatDuration(session.total_duration_seconds)}
                  emoji={session.activity?.emoji}
                  onClick={() => handleOpenSessionPopup(session)}
                />
              ))}
              {otherSessions.length === 0 && <p className="text-sm text-gray-500">No past sessions</p>}
            </div>

          </div>

          {/* Right Sidebar - Desktop Only */}
          <div style={{ width: "450px" }} className="flex-shrink-0">
            <div className="sticky top-24 space-y-6 bg-white dark:bg-dark-2 rounded-2xl p-6 border" style={{ borderColor: 'var(--border)' }}>

              <div className="w-full h-[220px]">
                <RadarChart
                  data={[
                    { aspect: "Physique", value: 1, fullMark: 12 },
                    { aspect: "Energy", value: 1, fullMark: 12 },
                    { aspect: "Logic", value: 1, fullMark: 12 },
                    { aspect: "Creativity", value: 1, fullMark: 12 },
                    { aspect: "Social", value: 1, fullMark: 12 },
                  ]}
                  masteryTitle={"Beginner"}
                  username={"User"}
                />
              </div>

              {/* Aspect Chips */}
              <div>

                <div className="flex  justify-around gap-2">
                  <AspectChip icon={<BiDumbbell className="w-4 h-4" />} value={0} tint="physique" />
                  <AspectChip icon={<BoltIcon className="w-4 h-4" />} value={0} tint="energy" />
                  <AspectChip icon={<UsersIcon className="w-4 h-4" />} value={0} tint="social" />
                  <AspectChip icon={<FaBrain className="w-4 h-4" />} value={0} tint="creativity" />
                  <AspectChip icon={<FaHammer className="w-4 h-4" />} value={0} tint="logic" />
                </div>
              </div>

              {/* Creation Date */}

              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Created on {formatDate(goal.created_at)}
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
                  <span className="text-lg font-bold text-foreground dark:text-white">{formatDuration(totalDurationSeconds)}</span>
                </div>

                <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

                {/* XP Gained */}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>XP gained</span>
                  <span className="text-lg font-bold text-foreground dark:text-white">{totalXp}</span>
                </div>

                <div className="h-px" style={{ backgroundColor: 'var(--border)' }} />

                {/* Likes */}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Likes</span>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-2 bg-gray-400"
                      />
                    </div>
                    <span className="text-md font-semibold text-foreground dark:text-white">+0</span>
                  </div>
                </div>
              </div>



              {/* Complete Goal Button */}
              {!goalCompleted && (
                <button
                  className="w-full py-3 rounded-2xl font-medium text-white text-md transition-all active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--rookie-primary)',
                  }}
                  onClick={handleOpenCompleteGoal}
                >
                  Complete Goal
                </button>
              )}
            </div>
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