"use client";

import { CommentSection } from "@/src/components/homepage/CommentSection";
import { LiveAvatar } from "@/src/components/LiveAvatar";
import SessionInfoPopup from "@/src/components/goals/SessionInfoPopup";
import { useToast } from "@/src/context/ToastContext";
import { getResponseError } from "@/src/lib/api/responseError";
import { supabase } from "@/src/lib/supabase";
import {
  ChatBubbleOvalLeftIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/solid";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { memo, useState } from "react";

export type ApiSessionPost = {
  type: "session";
  id: string;
  uid: string;
  name: string;
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
  activity: { uid?: string; name: string; type: string; emoji: string };
  goal: { id: number; uid: string; title: string; emoji: string } | null;
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

type CachedFeedItem = {
  id?: string;
  type?: string;
  is_nudged?: boolean;
  nudge_count?: number;
  [key: string]: unknown;
};

type CachedFeedData = {
  pages: Array<{
    list: CachedFeedItem[];
    [key: string]: unknown;
  }>;
  pageParams: unknown[];
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

// Mirrors the goal detail page's SessionInfoPopup formatting
// (app/(main)/goals/[goalId]/page.tsx) so the popup reads identically here.
function formatPopupDuration(seconds: number | null): string {
  if (!seconds) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatPopupDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function SessionPostComponent({ session }: { session: ApiSessionPost }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, goal, activity } = session;
  const goalHref = goal?.uid
    ? `/goals/${goal.uid}?owner=${encodeURIComponent(user.username)}`
    : "#";

  const [showComments, setShowComments] = useState(false);
  const [commentCount] = useState(session.comment_count ?? 0);
  const [nudgeCount, setNudgeCount] = useState(session.nudge_count ?? 0);
  const [hasNudged, setHasNudged] = useState(
    session.is_nudged === true,
  );
  const [nudging, setNudging] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSessionPopupOpen, setIsSessionPopupOpen] = useState(false);

  const handleShare = (uid: string) => {
    copyGoalLink(uid);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleNudge = async () => {
    if (nudging) return;
    const previousNudged = hasNudged;
    const previousCount = nudgeCount;
    const nextNudged = !previousNudged;

    setHasNudged(nextNudged);
    setNudgeCount(Math.max(0, previousCount + (nextNudged ? 1 : -1)));
    setNudging(true);
    try {
      const {
        data: { session: supaSession },
      } = await supabase.auth.getSession();
      const res = await fetch(`/api/sessions/${session.id}/nudge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(supaSession?.access_token
            ? { Authorization: `Bearer ${supaSession.access_token}` }
            : {}),
        },
        body: JSON.stringify({ is_nudged: nextNudged }),
      });
      if (!res.ok) {
        throw new Error(await getResponseError(res, "Could not update nudge"));
      }

      const data = (await res.json().catch(() => null)) as {
        nudge_count?: number;
      } | null;
      // The user's click owns the boolean state; a delayed response must not
      // flip it back. The response is only used to reconcile the shared count.
      const confirmedCount =
        typeof data?.nudge_count === "number"
          ? data.nudge_count
          : Math.max(0, previousCount + (nextNudged ? 1 : -1));
      setHasNudged(nextNudged);
      setNudgeCount(confirmedCount);
      queryClient.setQueriesData<CachedFeedData>(
        { queryKey: ["feed"] },
        (cached) => {
          if (!cached?.pages) return cached;
          return {
            ...cached,
            pages: cached.pages.map((page) => ({
              ...page,
              list: page.list.map((item) =>
                item.type === "session" && item.id === session.id
                  ? {
                      ...item,
                      is_nudged: nextNudged,
                      nudge_count: confirmedCount,
                    }
                  : item,
              ),
            })),
          };
        },
      );
    } catch (err) {
      setHasNudged(previousNudged);
      setNudgeCount(previousCount);
      console.error("Failed to nudge session:", err);
      toast.error(
        err instanceof Error ? err.message : "Could not update nudge",
      );
    } finally {
      setNudging(false);
    }
  };

  const handleNameSaved = (savedName: string) => {
    queryClient.setQueriesData<CachedFeedData>(
      { queryKey: ["feed"] },
      (cached) => {
        if (!cached?.pages) return cached;
        return {
          ...cached,
          pages: cached.pages.map((page) => ({
            ...page,
            list: page.list.map((item) =>
              item.type === "session" && item.id === session.id
                ? { ...item, name: savedName }
                : item,
            ),
          })),
        };
      },
    );
  };

  return (
    <div
      id="post-card"
      className="mb-6 md:p-6 md:rounded-xl md:border-2 md:bg-white md:border-gray-200 md:dark:bg-dark-2 md:dark:border-[var(--border)]"
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
            <LiveAvatar username={user.username}>
              <Image
                src={
                  user.profile_picture
                    ? user.profile_picture.replace(
                        "/upload/",
                        "/upload/f_auto,q_auto,w_800,c_fill/",
                      )
                    : "/default_pfp.png"
                }
                width={40}
                height={40}
                className={`rounded-full w-10 h-10 object-cover aspect-square

                `}
                // isMastery ? "p-[1.5px] border-opacity-50 border-2" : ""
                // style={isMastery ? { borderColor: user.primary_color } : {}}
                alt="User"
              />
            </LiveAvatar>
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
            className="dropdown hidden absolute right-0 mt-2 w-44 border bg-white dark:border-[var(--border)] dark:bg-dark-2 overflow-hidden rounded-sm shadow-lg z-50"
            style={{ borderColor: "var(--border)" }}
          >
            <a
              href={goalHref}
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
              disabled={!goal?.uid}
              onClick={() => goal?.uid && handleShare(goal.uid)}
              className="w-full cursor-pointer text-left font-medium py-3 px-4 text-sm
                        hover:bg-gray-100 dark:hover:bg-dark-3 transition-colors
                        dark:text-[#a5a5a6]"
            >
              {linkCopied ? "Link copied!" : "Share"}
            </button>
          </div>
        </div>
      </div>

      {/* SESSION BLOCK */}
      <div className="px-2 md:px-0">
        <div
          className="flex gap-4 cursor-pointer"
          onClick={() => setIsSessionPopupOpen(true)}
        >
          {/* 1:1 image or emoji placeholder */}

          <div className="shrink-0">
            {session.completion_picture ? (
              <Image
                width={96}
                height={96}
                className="w-24 h-24 object-cover rounded-lg cursor-pointer"
                src={session.completion_picture.replace(
                  "/upload/",
                  "/upload/f_auto,q_auto,w_150,c_fill/",
                )}
                alt="Completion"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-100 dark:bg-dark-3/50 flex items-center justify-center rounded-lg cursor-pointer">
                <span className="text-4xl">{activity.emoji}</span>
              </div>
            )}
          </div>

          {/* Middle info */}
          <div className="flex flex-col justify-between gap-1  w-full min-w-0">
            <p
              className="text-lg font-bold"
              style={{ color: `var(--aspect-${activity.type.toLowerCase()})` }}
            >
              {activity.name}
            </p>

            <p className="text-sm font-semibold text-gray-500 dark:text-[var(--muted)]">
              {session.name
                ? `${session.name} ${goal?.title ? `(${goal.title.slice(0, 30)})` : ""}`
                : `Session ${session.session_number} ${goal?.title ?? ""}`}
            </p>

            <p className="text-sm text-gray-500 dark:text-[var(--muted)]">
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
          <button
            type="button"
            onClick={handleNudge}
            disabled={nudging}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold border transition-all cursor-pointer active:scale-95 disabled:cursor-default disabled:opacity-70 ${
              hasNudged
                ? "hover:brightness-95 dark:hover:brightness-125"
                : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 dark:bg-dark-3 dark:border-[var(--border)] dark:text-[var(--muted)] dark:hover:bg-dark-3/70"
            }`}
            style={
              hasNudged
                ? {
                    color: `var(--aspect-${activity.type.toLowerCase()})`,
                    backgroundColor: `rgba(var(--aspect-${activity.type.toLowerCase()}-rgb), 0.15)`,
                    borderColor: `rgba(var(--aspect-${activity.type.toLowerCase()}-rgb), 0.35)`,
                  }
                : undefined
            }
          >
            <span className="text-base leading-none">👋</span>
            <span>{nudgeCount}</span>
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowComments(true)}
          >
            <ChatBubbleOvalLeftIcon className="w-8 h-8 text-gray-500 opacity-50 hover:text-gray-700 dark:text-[var(--muted)] dark:hover:text-[var(--foreground)] cursor-pointer" />
            <span className="text-md font-medium text-gray-500 dark:text-[var(--muted)]">
              {commentCount}
            </span>
          </div>
        </div>
      </div>

      <SessionInfoPopup
        isOpen={isSessionPopupOpen}
        onClose={() => setIsSessionPopupOpen(false)}
        sessionId={session.id}
        sessionNumber={session.session_number}
        name={session.name}
        onNameSaved={handleNameSaved}
        dateText={formatPopupDate(session.started_at)}
        coverImageUrl={session.completion_picture || undefined}
        totalDuration={formatPopupDuration(session.total_duration_seconds)}
        focusedDuration={formatPopupDuration(session.focused_duration_seconds)}
        xpEarned={session.xp_total}
        xpDistribution={session.xp_distribution}
        nudgeCount={session.nudge_count ?? 0}
        nudgeAvatars={[]}
        activity={{
          uid: activity.uid,
          name: activity.name,
          emoji: activity.emoji,
          color: `var(--aspect-${activity.type.toLowerCase()})`,
        }}
      />
    </div>
  );
}

export const SessionPost = memo(SessionPostComponent);
