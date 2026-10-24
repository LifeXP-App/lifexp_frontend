"use client";

import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";
import {
  WeekStrip,
  formatShortDuration,
  sessionSeconds,
  type SessionDay,
} from "@/src/components/profile/SessionTimeline";

const ASPECTS: ActivityType[] = ["physique", "energy", "social", "creativity", "logic"];

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-3">
      <p className="text-lg font-semibold tabular-nums text-gray-800 dark:text-[var(--foreground)]">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-[var(--muted)]">{label}</p>
    </div>
  );
}

// Side panel next to the profile's session timeline — always has something
// to show (zeros, the week strip, last-active date) even on a quiet week, so
// the section never looks empty.
export default function WeekSummary({
  days,
  weekStart,
  color,
  dayHref,
}: {
  days: SessionDay[];
  weekStart: Date;
  color: string;
  dayHref?: (dayKey: string) => string;
}) {
  const sessions = days.flatMap((day) => day.sessions);
  const seconds = days.reduce((sum, day) => sum + day.seconds, 0);
  const xp = days.reduce((sum, day) => sum + day.xp, 0);

  const aspectXp = ASPECTS.map((aspect) => ({
    aspect,
    xp: sessions.reduce((sum, s) => sum + (s[`xp_${aspect}`] ?? 0), 0),
  }))
    .filter((a) => a.xp > 0)
    .sort((a, b) => b.xp - a.xp);
  const aspectTotal = aspectXp.reduce((sum, a) => sum + a.xp, 0);

  const byActivity = new Map<string, { name: string; emoji: string; seconds: number }>();
  for (const s of sessions) {
    const key = s.activity?.uid || s.activity?.name || s.id;
    const entry = byActivity.get(key) ?? {
      name: s.activity?.name ?? "Session",
      emoji: s.activity?.emoji ?? "🎯",
      seconds: 0,
    };
    entry.seconds += sessionSeconds(s);
    byActivity.set(key, entry);
  }
  const topActivity = [...byActivity.values()].sort((a, b) => b.seconds - a.seconds)[0];

  // Ring: how many of the week's 7 days had a session.
  const RING = 148;
  const STROKE = 12;
  const radius = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const dayProgress = Math.min(1, days.length / 7);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center">
        <p className="mb-3 self-start text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[var(--muted)]">
          This week
        </p>
        <div
          className="relative"
          style={{ width: RING, height: RING }}
          role="progressbar"
          aria-label="Days active this week"
          aria-valuemin={0}
          aria-valuemax={7}
          aria-valuenow={days.length}
        >
          <svg width={RING} height={RING} className="-rotate-90">
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={radius}
              fill="none"
              strokeWidth={STROKE}
              className="stroke-gray-200 dark:stroke-[var(--dark-3)]"
            />
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={radius}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              stroke={color}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - dayProgress)}
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-3xl font-bold tabular-nums leading-none" style={{ color }}>
              {formatShortDuration(seconds)}
            </p>
            <p className="mt-1.5 max-w-[96px] text-xs leading-tight text-gray-500 dark:text-[var(--muted)]">
              focused time
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold tabular-nums text-gray-800 dark:text-[var(--foreground)]">
          {days.length}
          <span className="font-normal text-gray-500 dark:text-[var(--muted)]"> of 7 days</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat value={sessions.length} label="Sessions" />
        <Stat value={xp > 0 ? `+${xp}` : 0} label="XP" />
      </div>

      <WeekStrip days={days} weekStart={weekStart} color={color} dayHref={dayHref} />

      {aspectTotal > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[var(--muted)]">
            XP by aspect
          </p>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-[var(--dark-3)]">
            {aspectXp.map((a) => (
              <span
                key={a.aspect}
                style={{ width: `${(a.xp / aspectTotal) * 100}%`, backgroundColor: ACTIVITY_META[a.aspect].cssColorVar }}
                title={`${ACTIVITY_META[a.aspect].label}: ${a.xp} XP`}
              />
            ))}
          </div>
        </div>
      )}

      {topActivity && (
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-3">
          <span className="text-2xl" aria-hidden="true">{topActivity.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[var(--muted)]">
              Top activity
            </p>
            <p className="truncate text-sm font-semibold text-gray-800 dark:text-[var(--foreground)]">{topActivity.name}</p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-gray-800 dark:text-[var(--foreground)]">
            {formatShortDuration(topActivity.seconds)}
          </span>
        </div>
      )}
    </div>
  );
}
