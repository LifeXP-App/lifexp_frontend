"use client";

import { CommentSection } from "@/src/components/homepage/CommentSection";
import { supabase } from "@/src/lib/supabase";
import {
  ChatBubbleOvalLeftIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { useState } from "react";

export type ApiSessionPost = {
  type: "session";
  id: string;
  uid: string;
  session_number: number;
  day: number;
  status: string;
  started_at: string;
  ended_at: string | null;
  total_duration_seconds: number | null;
  focused_duration_seconds: number | null;
  duration: string;
  xp_total: number;
  xp_distribution: {
    physique: number;
    energy: number;
    logic: number;
    creativity: number;
    social: number;
  };
  completion_picture: string | null;
  completed_reason: string | null;
  nudge_count: number;
  is_nudged: boolean;
  activity: { name: string; type: string; emoji: string };
  goal: { id: number; uid: string; title: string; emoji: string };
  user: {
    username: string;
    fullname: string;
    profile_picture: string;
    mastery_title: string;
    life_level: number;
    primary_color: string;
    secondary_color: string;
  };
  like_count: number;
  comment_count: number;
};

function toggleDropdown(btn: HTMLElement) {
  const dropdown = btn.parentElement?.querySelector(".dropdown");
  dropdown?.classList.toggle("hidden");
}

function copyGoalLink(uid: string) {
  navigator.clipboard.writeText(`${window.location.origin}/goals/${uid}`);
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInMs < 60000) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSessionTime(dateString: string): string {
  const date = new Date(dateString);
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const day = date.getDate();
  const month = date.toLocaleDateString(undefined, { month: "long" });
  const year = date.getFullYear();
  return `${time} • ${day} ${month} ${year}`;
}

export function SessionPost({ session }: { session: ApiSessionPost }) {
  const { user, goal, activity } = session;

  const [showComments, setShowComments] = useState(false);
  const [commentCount] = useState(session.comment_count ?? 0);
  const [nudgeCount, setNudgeCount] = useState(session.nudge_count ?? 0);
  const [hasNudged, setHasNudged] = useState(session.is_nudged);
  const [nudging, setNudging] = useState(false);

  const handleNudge = async () => {
    if (nudging || hasNudged) return;
    // Optimistic — feel instant
    setHasNudged(true);
    setNudgeCount((prev) => prev + 1);
    setNudging(true);
    try {
      const {
        data: { session: supaSession },
      } = await supabase.auth.getSession();
      const res = await fetch(`/api/sessions/${session.id}/nudge`, {
        method: "POST",
        headers: supaSession?.access_token
          ? { Authorization: `Bearer ${supaSession.access_token}` }
          : {},
      });
      if (res.status === 201) {
        const data = await res.json();
        setNudgeCount(data.nudge_count);
      } else if (res.status !== 409) {
        // 409 = already nudged, keep state. Anything else = revert.
        setHasNudged(false);
        setNudgeCount((prev) => prev - 1);
      }
    } catch {
      setHasNudged(false);
      setNudgeCount((prev) => prev - 1);
    } finally {
      setNudging(false);
    }
  };

  return (
    <div
      id="post-card"
      className="mb-6 md:p-6 md:rounded-xl md:border-2 md:bg-white md:border-gray-200 md:dark:bg-dark-2 md:dark:border-gray-900"
    >
      {showComments && (
        <CommentSection
          commentsEndpoint={`/api/sessions/${session.id}/comments`}
          initialComments={[]}
          onClose={() => setShowComments(false)}
        />
      )}
      {/* HEADER */}
      <div className="flex px-2 md:px-0 items-center mb-4">
        <Link href={`/u/${user.username}`}>
          <div className="flex items-center cursor-pointer">
            <img
              src={user.profile_picture.replace(
                "/upload/",
                "/upload/f_auto,q_auto,w_800,c_fill/",
              )}
              className={`rounded-full w-10 h-10 object-cover aspect-square 
               
              `}
              // isMastery ? "p-[1.5px] border-opacity-50 border-2" : ""
              // style={isMastery ? { borderColor: user.primary_color } : {}}
              alt="User"
            />
            <div className="ml-3">
              <span className="flex items-center gap-2">
                <p className="text-sm md:text-base font-semibold">
                  {user.fullname}
                </p>
                <p className="text-sm md:text-base font-regular text-gray-500">
                  @{user.username}
                </p>
              </span>
              <p className="text-sm text-gray-500">
                {getTimeAgo(session.started_at)}
              </p>
            </div>
          </div>
        </Link>

        {/* DROPDOWN */}
        <div className="relative inline-block text-left ml-auto">
          <button
            onClick={(e) => toggleDropdown(e.currentTarget as HTMLElement)}
            className="cursor-pointer hover:opacity-80 active:opacity-60 p-1 rounded-full"
          >
            <EllipsisVerticalIcon className="w-6 h-6" />
          </button>

          <div
            className="dropdown hidden absolute right-0 mt-2 w-44 border bg-white dark:border-gray-900 dark:bg-dark-2 overflow-hidden rounded-sm shadow-lg z-50"
            style={{ borderColor: "var(--border)" }}
          >
            <a
              href={`/goals/${goal.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block cursor-pointer w-full text-left font-medium py-3 px-4 text-sm
                        hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors
                        dark:text-[#a5a5a6]"
            >
              Go to goal
            </a>
            <button
              type="button"
              onClick={() => copyGoalLink(goal.uid)}
              className="w-full cursor-pointer text-left font-medium py-3 px-4 text-sm
                        hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors
                        dark:text-[#a5a5a6]"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      {/* SESSION BLOCK */}
      <div className="px-2 md:px-0">
        <div className="flex gap-4 ">
          {/* 1:1 image or emoji placeholder */}
          <Link href={`/goals/${goal.uid}`} className="shrink-0">
            {session.completion_picture ? (
              <img
                className="w-24 h-24 object-cover rounded-lg cursor-pointer"
                src={session.completion_picture.replace(
                  "/upload/",
                  "/upload/f_auto,q_auto,w_150,c_fill/",
                )}
                alt="Completion"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg cursor-pointer">
                <span className="text-4xl">{activity.emoji}</span>
              </div>
            )}
          </Link>

          {/* Middle info */}
          <div className="flex flex-col justify-between gap-1  w-full min-w-0">
            <p
              className="text-lg font-bold"
              style={{ color: `var(--aspect-${activity.type.toLowerCase()})` }}
            >
              {activity.name}
            </p>

            <Link href={`/goals/${goal.uid}`}>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Session {session.session_number} {goal.title}
              </p>
            </Link>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {session.xp_total} XP • {formatSessionTime(session.started_at)}
            </p>
          </div>

          {/* Right: XP + duration */}
          <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">
            <p className="text-sm md:text-xl font-bold text-black dark:text-[#dfdfe0] whitespace-nowrap mr-2">
              {session.duration}
            </p>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="flex items-center mt-6 gap-6 justify-between px-1">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleNudge}
          >
            <span
              className="text-md font-medium transition-all border-2 rounded-md px-2 py-1"
              style={
                hasNudged
                  ? {
                      color: `var(--aspect-${activity.type.toLowerCase()})`,
                      borderColor: `var(--aspect-${activity.type.toLowerCase()})`,
                      backgroundColor: `color-mix(in srgb, var(--aspect-${activity.type.toLowerCase()}) 12%, transparent)`,
                    }
                  : {
                      color: "rgb(100 100 100)",
                      borderColor: "rgb(100 100 100)",
                    }
              }
            >
              <b>👋 {nudgeCount}</b>&nbsp; {hasNudged ? "Nudged" : "Nudge"}
            </span>
          </div>

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowComments(true)}
          >
            <ChatBubbleOvalLeftIcon className="w-8 h-8 text-gray-500 opacity-50 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer" />
            <span className="text-md font-medium text-gray-500 dark:text-gray-400">
              {commentCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
