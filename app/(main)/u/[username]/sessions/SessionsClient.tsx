"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/20/solid";
import getAccentColors from "@/src/components/UserAccent";
import LoadMoreSentinel from "@/src/components/LoadMoreSentinel";
import PrivateProfileNotice from "@/src/components/profile/PrivateProfileNotice";
import ProfileSessionPopup from "@/src/components/profile/ProfileSessionPopup";
import SessionHeatmap, { type HeatmapDay } from "@/src/components/profile/SessionHeatmap";
import SessionTimeline, {
  SessionTimelineSkeleton,
  formatDayLabel,
  formatShortDuration,
  localDayKey,
  parseDayKey,
  type ProfileSession,
} from "@/src/components/profile/SessionTimeline";
import { useAuth } from "@/src/context/AuthContext";
import { authedFetch } from "@/src/lib/api/authedFetch";
import type { UserProfile } from "@/src/lib/types";

interface PageProps {
  params: Promise<{ username: string }>;
}

type HeatmapResponse = {
  days: HeatmapDay[];
  totals: { count: number; focused_seconds: number; xp: number; active_days: number };
};

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;
const PAGE_SIZE = 30;

// The last ~year, widened back to a Monday so the heatmap's first column is
// a full week. Stays under the backend's 371-day cap.
function heatmapRange() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return { from: localDayKey(start), to: localDayKey(today) };
}

const card =
  "p-4 sm:p-6 bg-white border border-gray-200 dark:bg-dark-2 dark:border-[var(--border)] rounded-2xl";

export default function SessionsClient({ params }: PageProps) {
  const { username } = use(params);
  const { loading: authLoading } = useAuth();

  const [range] = useState(heatmapRange);
  const [timeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  // ?day=YYYY-MM-DD preselects a day (the profile's week strip links here).
  const searchParams = useSearchParams();
  const [selectedDay, setSelectedDay] = useState<string | null>(() => {
    const day = searchParams.get("day");
    return day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
  });
  const [selectedSession, setSelectedSession] = useState<ProfileSession | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile-user", username],
    queryFn: async () => {
      const response = await authedFetch(`/api/users/profile/${username}`, { cache: "no-store" });
      return response.ok ? ((await response.json()) as UserProfile) : null;
    },
    enabled: !authLoading,
    staleTime: 2 * 60 * 1000,
  });

  const heatmap = useQuery({
    queryKey: ["profile-session-heatmap", username, range.from, range.to, timeZone],
    queryFn: async () => {
      const query = new URLSearchParams({ from: range.from, to: range.to, tz: timeZone });
      const response = await authedFetch(`${API_URL}/users/${username}/sessions/heatmap/?${query}`, {
        cache: "no-store",
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Couldn’t load activity.");
      return (await response.json()) as HeatmapResponse;
    },
    enabled: !authLoading,
    staleTime: 2 * 60 * 1000,
  });

  const timeline = useInfiniteQuery({
    queryKey: ["profile-session-timeline", username, selectedDay],
    queryFn: async ({ pageParam }) => {
      const query = new URLSearchParams({ page: String(pageParam), page_size: String(PAGE_SIZE) });
      if (selectedDay) {
        // Local-midnight bounds of the picked day, so the list matches the
        // heatmap cell (both bucket by the viewer's timezone).
        const start = parseDayKey(selectedDay);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        query.set("after", start.toISOString());
        query.set("before", end.toISOString());
      }
      const response = await authedFetch(`${API_URL}/users/${username}/sessions/gallery/?${query}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Couldn’t load sessions.");
      const data = await response.json();
      return {
        results: (data.results ?? []) as ProfileSession[],
        next: (data.next ?? null) as string | null,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => (lastPage.next ? allPages.length + 1 : undefined),
    enabled: !authLoading && heatmap.data !== null,
    staleTime: 2 * 60 * 1000,
  });

  const accent = getAccentColors(profile?.masteryTitle ?? "rookie");
  const sessions = timeline.data?.pages.flatMap((page) => page.results) ?? [];
  const totals = heatmap.data?.totals;
  const isPrivate = heatmap.data === null;

  const handleSelectDay = (day: string) => {
    setSelectedDay((current) => (current === day ? null : day));
  };

  return (
    <main className="w-full min-h-[calc(100vh-60px)] bg-gray-100 dark:bg-dark-1 px-4 py-4 sm:px-6 md:px-8 lg:px-12 xl:px-24">
      <ProfileSessionPopup
        session={selectedSession}
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
      />

      <div className="flex w-full flex-col gap-4">
        <header className="pt-2">
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-black dark:text-[var(--muted)] dark:hover:text-[var(--foreground)]"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />@{username}
          </Link>
          <h1 className="mt-2 text-2xl font-bold dark:text-[var(--foreground)]">Sessions</h1>
          {totals && totals.count > 0 && (
            <p className="mt-1 text-sm text-gray-500 dark:text-[var(--muted)]">
              {totals.count} session{totals.count === 1 ? "" : "s"} · {formatShortDuration(totals.focused_seconds)} ·{" "}
              {totals.active_days} active day{totals.active_days === 1 ? "" : "s"} in the last year
            </p>
          )}
        </header>

        {isPrivate ? (
          <PrivateProfileNotice username={username} />
        ) : (
          <>
            <section className={card} aria-label="Activity heatmap">
              {heatmap.isPending ? (
                <div className="h-[136px] animate-pulse rounded-lg bg-gray-100 dark:bg-[var(--dark-3)]" />
              ) : heatmap.isError ? (
                <p className="text-sm text-gray-500 dark:text-[var(--muted)]">
                  Couldn’t load activity.{" "}
                  <button onClick={() => void heatmap.refetch()} className="cursor-pointer font-semibold underline">
                    Try again
                  </button>
                </p>
              ) : (
                <SessionHeatmap
                  days={heatmap.data?.days ?? []}
                  from={range.from}
                  to={range.to}
                  color={accent.primary}
                  selectedDay={selectedDay}
                  onSelectDay={handleSelectDay}
                />
              )}
            </section>

            <section className={card} aria-label="Session timeline">
              {selectedDay && (
                <div className="mb-5 flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-[var(--muted)]">Showing</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="inline-flex items-center gap-1 rounded-full py-1 pl-3 pr-2 text-sm font-semibold cursor-pointer"
                    style={{ backgroundColor: accent.rgba(accent.primary, 0.15), color: accent.primary }}
                  >
                    {formatDayLabel(selectedDay, { relative: false })}
                    <XMarkIcon className="h-4 w-4" aria-label="Clear day filter" />
                  </button>
                </div>
              )}

              {timeline.isPending ? (
                <SessionTimelineSkeleton />
              ) : timeline.isError ? (
                <p className="text-sm text-gray-500 dark:text-[var(--muted)]">
                  Couldn’t load sessions.{" "}
                  <button onClick={() => void timeline.refetch()} className="cursor-pointer font-semibold underline">
                    Try again
                  </button>
                </p>
              ) : sessions.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500 dark:text-[var(--muted)]">
                  {selectedDay
                    ? `No sessions on ${formatDayLabel(selectedDay, { relative: false })}`
                    : "No sessions yet"}
                </p>
              ) : (
                <>
                  <SessionTimeline
                    sessions={sessions}
                    onSelectSession={setSelectedSession}
                    accentColor={accent.primary}
                    // A single picked day shows everything; the full history
                    // collapses busy days so it stays scannable.
                    maxCardsPerDay={selectedDay ? Infinity : 4}
                  />
                  <LoadMoreSentinel
                    loading={timeline.isFetchingNextPage}
                    hasMore={!!timeline.hasNextPage}
                    onLoadMore={() => void timeline.fetchNextPage()}
                  />
                  {timeline.isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent dark:border-[var(--border)]" />
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
