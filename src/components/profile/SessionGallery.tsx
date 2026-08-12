"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";

export type GallerySession = {
  id: string;
  uid: string;
  session_number?: number;
  activity?: {
    id: string;
    uid?: string;
    name: string;
    emoji?: string;
    type?: string;
  };
  goal?: { uid: string; title: string } | null;
  total_duration_seconds: number;
  focused_duration_seconds?: number;
  started_at: string;
  ended_at?: string;
  completion_picture?: string | null;
  xp_physique?: number;
  xp_energy?: number;
  xp_logic?: number;
  xp_creativity?: number;
  xp_social?: number;
};

// Buckets sessions into gallery-style date groups: Today, Yesterday, This
// Week, This Month, then "Month YYYY" for everything older — in that order,
// each group internally sorted newest-first (callers already provide
// newest-first order from the API, this only splits into buckets).
function groupSessionsByDate(sessions: GallerySession[]): { label: string; sessions: GallerySession[] }[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  // Week starts Monday.
  const dayOfWeek = (startOfToday.getDay() + 6) % 7;
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const buckets = new Map<string, GallerySession[]>();
  const order: string[] = [];

  const pushTo = (label: string, session: GallerySession) => {
    if (!buckets.has(label)) {
      buckets.set(label, []);
      order.push(label);
    }
    buckets.get(label)!.push(session);
  };

  for (const session of sessions) {
    const startedAt = new Date(session.started_at);
    if (Number.isNaN(startedAt.getTime())) {
      pushTo("Earlier", session);
      continue;
    }

    if (startedAt >= startOfToday) {
      pushTo("Today", session);
    } else if (startedAt >= startOfYesterday) {
      pushTo("Yesterday", session);
    } else if (startedAt >= startOfWeek) {
      pushTo("This Week", session);
    } else if (startedAt >= startOfMonth) {
      pushTo("This Month", session);
    } else {
      const label = startedAt.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      pushTo(label, session);
    }
  }

  return order.map((label) => ({ label, sessions: buckets.get(label)! }));
}

function SessionTypeBadge({ type }: { type?: string }) {
  const meta = type ? ACTIVITY_META[type as ActivityType] : undefined;
  if (!meta) return null;

  return (
    <div
      className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm"
      style={{
        backgroundColor: `rgba(${meta.cssColorVarRgb}, 0.25)`,
        color: meta.cssColorVar,
      }}
      title={meta.label}
    >
      {meta.icon}
    </div>
  );
}

function SessionGalleryCard({
  session,
  onClick,
}: {
  session: GallerySession;
  onClick: () => void;
}) {
  const goalTitle = session.goal?.title || "Free Session";
  const activityName = session.activity?.name ?? "Activity";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[#151618] text-left cursor-pointer transition-transform active:scale-[0.98]"
    >
      <SessionTypeBadge type={session.activity?.type} />
      <div className="relative h-32 w-full shrink-0 bg-gray-100 dark:bg-dark-3 flex items-center justify-center overflow-hidden">
        {session.completion_picture ? (
          <Image
            src={session.completion_picture}
            alt={activityName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <span className="text-4xl">{session.activity?.emoji ?? "🎯"}</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-0.5 min-w-0">
        <p className="font-semibold text-sm text-black dark:text-[var(--foreground)] truncate">
          {activityName}
        </p>
        <p className="text-xs text-gray-500 dark:text-[var(--muted)] truncate">
          {goalTitle}
        </p>
      </div>
    </button>
  );
}

function SessionGallerySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden border border-gray-200 dark:border-[var(--border)] bg-white dark:bg-[#151618]"
        >
          <div className="h-32 bg-gray-200 dark:bg-[var(--dark-2)]" />
          <div className="p-3 space-y-2">
            <div className="h-3.5 w-2/3 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
            <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-[var(--dark-2)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Sentinel div whose visibility (via IntersectionObserver) triggers loading
// the next page — same pattern as the home feed's FeedLoadMore.
function LoadMoreSentinel({
  loading,
  hasMore,
  onLoadMore,
}: {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!node || !hasMore) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "600px", threshold: 0 },
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, [node, loading, hasMore, onLoadMore]);

  return <div ref={setNode} className="h-1 w-full" />;
}

export default function SessionGallery({
  sessions,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onSelectSession,
  emptyState,
}: {
  sessions: GallerySession[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelectSession: (session: GallerySession) => void;
  emptyState?: React.ReactNode;
}) {
  if (loading) return <SessionGallerySkeleton />;

  if (sessions.length === 0) {
    return (
      emptyState ?? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-[var(--muted)]">No sessions yet</p>
        </div>
      )
    );
  }

  const groups = groupSessionsByDate(sessions);

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-sm font-semibold text-gray-500 dark:text-[var(--muted)] uppercase tracking-wide mb-4">
            {group.label}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.sessions.map((session) => (
              <SessionGalleryCard
                key={session.id}
                session={session}
                onClick={() => onSelectSession(session)}
              />
            ))}
          </div>
        </div>
      ))}
      <LoadMoreSentinel loading={loadingMore} hasMore={hasMore} onLoadMore={onLoadMore} />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-gray-300 dark:border-[var(--border)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
