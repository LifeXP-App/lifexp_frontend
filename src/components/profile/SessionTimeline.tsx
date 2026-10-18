"use client";

import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export type ProfileSession = {
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
  xp_total?: number;
  xp_physique?: number;
  xp_energy?: number;
  xp_logic?: number;
  xp_creativity?: number;
  xp_social?: number;
};

export type SessionDay = {
  key: string;
  sessions: ProfileSession[];
  count: number;
  seconds: number;
  xp: number;
};

// ---------- formatting ----------

// Local-timezone YYYY-MM-DD — the same day keys the heatmap endpoint returns
// when it's queried with the viewer's timezone.
export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayLabel(key: string, { relative = true } = {}): string {
  const today = new Date();
  if (relative) {
    if (key === localDayKey(today)) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (key === localDayKey(yesterday)) return "Yesterday";
  }
  const date = parseDayKey(key);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
}

export function formatShortDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m`;
  return seconds > 0 ? `${Math.round(seconds)}s` : "0m";
}

// Active time, paused time excluded — matches the "Recent Sessions" card.
export function sessionSeconds(session: ProfileSession): number {
  return (
    session.focused_duration_seconds ?? session.total_duration_seconds ?? 0
  );
}

export function sessionXp(session: ProfileSession): number {
  if (typeof session.xp_total === "number") return session.xp_total;
  return (
    (session.xp_physique ?? 0) +
    (session.xp_energy ?? 0) +
    (session.xp_logic ?? 0) +
    (session.xp_creativity ?? 0) +
    (session.xp_social ?? 0)
  );
}

export function summarizeDay(
  day: Pick<SessionDay, "count" | "seconds" | "xp">,
): string {
  const parts = [
    `${day.count} session${day.count === 1 ? "" : "s"}`,
    formatShortDuration(day.seconds),
  ];
  if (day.xp > 0) parts.push(`+${day.xp} XP`);
  return parts.join(" · ");
}

// ---------- grouping ----------

// Splits newest-first sessions into local-day buckets, keeping order.
export function groupSessionsByDay(sessions: ProfileSession[]): SessionDay[] {
  const days: SessionDay[] = [];
  const byKey = new Map<string, SessionDay>();

  for (const session of sessions) {
    const startedAt = new Date(session.started_at);
    if (Number.isNaN(startedAt.getTime())) continue;
    const key = localDayKey(startedAt);
    let day = byKey.get(key);
    if (!day) {
      day = { key, sessions: [], count: 0, seconds: 0, xp: 0 };
      byKey.set(key, day);
      days.push(day);
    }
    day.sessions.push(session);
    day.count += 1;
    day.seconds += sessionSeconds(session);
    day.xp += sessionXp(session);
  }

  return days;
}

// Within one day, repeats of the same activity collapse into a single row
// ("Gym ×2") so a busy day stays short. The row keeps the position of that
// activity's most recent session.
function mergeRepeats(sessions: ProfileSession[]): ProfileSession[][] {
  const rows: ProfileSession[][] = [];
  const byActivity = new Map<string, ProfileSession[]>();

  for (const session of sessions) {
    const key =
      session.activity?.uid ||
      session.activity?.id ||
      session.activity?.name ||
      session.id;
    const row = byActivity.get(key);
    if (row) {
      row.push(session);
    } else {
      const newRow = [session];
      byActivity.set(key, newRow);
      rows.push(newRow);
    }
  }

  return rows;
}

// ---------- cards ----------

function activityMeta(session: ProfileSession) {
  const type = session.activity?.type;
  return type ? ACTIVITY_META[type as ActivityType] : undefined;
}

function Thumbnail({
  src,
  alt,
  size,
}: {
  src: string;
  alt: string;
  size: number;
}) {
  return (
    <span
      className="relative shrink-0 overflow-hidden rounded-lg"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={`${size}px`}
      />
    </span>
  );
}

function formatClock(session: ProfileSession): string {
  return new Date(session.started_at).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

// One card per activity per day; repeats ("Gym ×2") expand in place to list
// each session.
function SessionCard({
  sessions,
  onSelectSession,
}: {
  sessions: ProfileSession[];
  onSelectSession: (session: ProfileSession) => void;
}) {
  const [open, setOpen] = useState(false);
  const first = sessions[0];
  const meta = activityMeta(first);
  const repeated = sessions.length > 1;
  const name = first.activity?.name ?? "Session";
  const seconds = sessions.reduce((sum, s) => sum + sessionSeconds(s), 0);
  const xp = sessions.reduce((sum, s) => sum + sessionXp(s), 0);
  const picture = sessions.find(
    (s) => s.completion_picture,
  )?.completion_picture;
  // A merged card only names the goal when every session shares it.
  const goalTitle = sessions.every((s) => s.goal?.uid === first.goal?.uid)
    ? first.goal?.title
    : undefined;
  const subtitle =
    goalTitle ??
    (repeated ? `${sessions.length} sessions` : formatClock(first));

  return (
    <li className="min-w-0 flex-1 basis-[260px] overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition-colors hover:border-gray-300 dark:border-[var(--border)] dark:bg-[var(--dark-3)]/40 dark:hover:border-gray-600">
      <button
        type="button"
        onClick={() => (repeated ? setOpen((v) => !v) : onSelectSession(first))}
        aria-expanded={repeated ? open : undefined}
        className="flex w-full items-center gap-3 p-3 text-left cursor-pointer"
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-2xl"
          style={{
            backgroundColor: meta
              ? `rgba(${meta.cssColorVarRgb}, 0.15)`
              : "var(--dark-3)",
          }}
          aria-hidden="true"
        >
          {first.activity?.emoji ?? "🎯"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-black dark:text-[var(--foreground)] sm:text-base">
              {name}
            </span>
            {repeated && (
              <span className="shrink-0 rounded-md bg-gray-200 px-1.5 text-xs font-bold text-gray-600 dark:bg-[var(--dark-3)] dark:text-[var(--muted)]">
                ×{sessions.length}
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-gray-500 dark:text-[var(--muted)]">
            {subtitle}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end tabular-nums">
          <span className="text-base font-bold text-gray-800 dark:text-[var(--foreground)]">
            {formatShortDuration(seconds)}
          </span>
          {xp > 0 && (
            <span
              className="text-xs font-semibold"
              style={{ color: meta?.cssColorVar ?? "var(--muted)" }}
            >
              +{xp} XP
            </span>
          )}
        </span>
        {picture && <Thumbnail src={picture} alt={name} size={44} />}
        {repeated && (
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        )}
      </button>

      {repeated && open && (
        <ul className="border-t border-gray-200 px-1.5 py-1 dark:border-[var(--border)]">
          {sessions.map((session) => (
            <li key={session.id}>
              <button
                type="button"
                onClick={() => onSelectSession(session)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-gray-100 dark:hover:bg-dark-3 cursor-pointer"
              >
                <span className="min-w-0 flex-1 truncate text-gray-500 dark:text-[var(--muted)]">
                  {formatClock(session)}
                  {session.goal?.title && !goalTitle
                    ? ` · ${session.goal.title}`
                    : ""}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-gray-700 dark:text-[var(--foreground)]">
                  {formatShortDuration(sessionSeconds(session))}
                </span>
                {sessionXp(session) > 0 && (
                  <span
                    className="w-12 shrink-0 text-right font-semibold"
                    style={{ color: meta?.cssColorVar }}
                  >
                    +{sessionXp(session)}
                  </span>
                )}
                {session.completion_picture && (
                  <Thumbnail
                    src={session.completion_picture}
                    alt={name}
                    size={28}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// ---------- day + timeline ----------

function TimelineDay({
  day,
  latest,
  accentColor,
  maxCardsPerDay,
  onSelectSession,
}: {
  day: SessionDay;
  latest: boolean;
  accentColor: string;
  maxCardsPerDay: number;
  onSelectSession: (session: ProfileSession) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cards = mergeRepeats(day.sessions);
  const visible = expanded ? cards : cards.slice(0, maxCardsPerDay);
  const hiddenCount = cards.length - visible.length;

  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      <span
        aria-hidden="true"
        className="relative mt-[5px] h-[11px] w-[11px] shrink-0 rounded-full border-2 bg-white dark:bg-dark-2"
        style={
          latest
            ? {
                borderColor: accentColor,
                backgroundColor: accentColor,
                boxShadow: `0 0 0 4px ${accentColor}26`,
              }
            : { borderColor: "#6b7280" }
        }
      />
      <div className="min-w-0 flex-1">
        <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <time
            dateTime={day.key}
            className="text-sm font-bold uppercase tracking-wide text-gray-800 dark:text-[var(--foreground)]"
          >
            {formatDayLabel(day.key)}
          </time>
          <span className="text-sm text-gray-500 dark:text-[var(--muted)]">
            {summarizeDay(day)}
          </span>
        </h3>
        {/* Cards grow to fill their row, so a one-session day doesn't leave
            the rest of the width empty. */}
        <ul className="mt-3 flex flex-wrap gap-3">
          {visible.map((group) => (
            <SessionCard
              key={group[0].id}
              sessions={group}
              onSelectSession={onSelectSession}
            />
          ))}
        </ul>
        {cards.length > maxCardsPerDay && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-black dark:text-[var(--muted)] dark:hover:text-[var(--foreground)] cursor-pointer"
          >
            {expanded ? "Show less" : `+ ${hiddenCount} more`}
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </li>
  );
}

// Mon–Sun overview of one week: a column per day whose fill shows focused
// time relative to the week's busiest day. Each day links to the full
// sessions page filtered to it.
export function WeekStrip({
  days,
  weekStart,
  color,
  dayHref,
}: {
  days: SessionDay[];
  weekStart: Date;
  color: string;
  dayHref: (dayKey: string) => string;
}) {
  const byKey = new Map(days.map((d) => [d.key, d]));
  const todayKey = localDayKey(new Date());
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return { key: localDayKey(date), date };
  });
  const maxSeconds = Math.max(
    1,
    ...week.map((d) => byKey.get(d.key)?.seconds ?? 0),
  );

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {week.map(({ key, date }) => {
        const day = byKey.get(key);
        const seconds = day?.seconds ?? 0;
        const future = key > todayKey;
        const isToday = key === todayKey;
        const fill =
          seconds > 0
            ? Math.max(8, Math.round((seconds / maxSeconds) * 100))
            : 0;
        const content = (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 rounded-b-[inherit] transition-[height]"
              style={{ height: `${fill}%`, backgroundColor: `${color}33` }}
            />
            <span className="relative text-[10px] font-semibold uppercase text-gray-500 dark:text-[var(--muted)]">
              {date.toLocaleDateString("en-US", { weekday: "narrow" })}
            </span>
            <span className="relative text-base font-bold text-gray-800 dark:text-[var(--foreground)]">
              {date.getDate()}
            </span>
            <span
              className="relative text-[10px] font-semibold tabular-nums"
              style={{ color: seconds > 0 ? color : undefined }}
            >
              {seconds > 0 ? formatShortDuration(seconds) : future ? "" : "–"}
            </span>
          </>
        );
        const className = `relative flex h-20 flex-col items-center justify-end gap-0.5 overflow-hidden rounded-lg border bg-gray-50 pb-1.5 dark:bg-[var(--dark-3)]/40 ${
          future ? "opacity-40" : ""
        }`;
        const style = { borderColor: isToday ? color : "var(--border)" };
        return future ? (
          <div key={key} className={className} style={style}>
            {content}
          </div>
        ) : (
          <Link
            key={key}
            href={dayHref(key)}
            className={`${className} transition-colors hover:brightness-110`}
            style={style}
            aria-label={`${formatDayLabel(key, { relative: false })}: ${day ? summarizeDay(day) : "no sessions"}`}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}

export function SessionTimelineSkeleton({ days = 3 }: { days?: number }) {
  return (
    <div
      className="space-y-6 animate-pulse"
      role="status"
      aria-label="Loading sessions"
    >
      {Array.from({ length: days }, (_, i) => (
        <div key={i} className="flex gap-4">
          <div className="mt-[3px] h-[11px] w-[11px] shrink-0 rounded-full bg-gray-200 dark:bg-[var(--dark-3)]" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-40 rounded bg-gray-200 dark:bg-[var(--dark-3)]" />
            <div className="h-8 w-full rounded-lg bg-gray-200 dark:bg-[var(--dark-3)]" />
            <div className="h-8 w-4/5 rounded-lg bg-gray-200 dark:bg-[var(--dark-3)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SessionTimeline({
  sessions,
  onSelectSession,
  accentColor,
  maxDays,
  maxCardsPerDay = 4,
}: {
  sessions: ProfileSession[];
  onSelectSession: (session: ProfileSession) => void;
  accentColor: string;
  maxDays?: number;
  maxCardsPerDay?: number;
}) {
  const allDays = groupSessionsByDay(sessions);
  const days = maxDays ? allDays.slice(0, maxDays) : allDays;

  return (
    <ol className="relative">
      {/* The rail runs behind the markers, from the first to the last one. */}
      {days.length > 1 && (
        <span
          aria-hidden="true"
          className="absolute bottom-3 left-[5px] top-2 w-px bg-gray-200 dark:bg-[var(--border)]"
        />
      )}
      {days.map((day, i) => (
        <TimelineDay
          key={day.key}
          day={day}
          latest={i === 0}
          accentColor={accentColor}
          maxCardsPerDay={maxCardsPerDay}
          onSelectSession={onSelectSession}
        />
      ))}
    </ol>
  );
}
