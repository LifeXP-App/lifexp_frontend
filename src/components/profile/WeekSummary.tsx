"use client";

import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";
import {
  WeekStrip,
  formatDayLabel,
  formatShortDuration,
  sessionSeconds,
  type SessionDay,
} from "@/src/components/profile/SessionTimeline";

const ASPECTS: ActivityType[] = ["physique", "energy", "social", "creativity", "logic"];

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-[var(--dark-3)]/40">
      <p className="text-lg font-bold tabular-nums text-gray-800 dark:text-[var(--foreground)]">{value}</p>
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
  lastActiveDay,
}: {
  days: SessionDay[];
  weekStart: Date;
  color: string;
  dayHref: (dayKey: string) => string;
  lastActiveDay?: string;
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

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[var(--muted)]">
          This week
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color }}>
          {formatShortDuration(seconds)}
        </p>
        <p className="text-xs text-gray-500 dark:text-[var(--muted)]">
          {sessions.length > 0
            ? "focused time"
            : lastActiveDay
              ? `Nothing yet — last active ${formatDayLabel(lastActiveDay, { relative: false })}`
              : "Nothing logged yet"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat value={sessions.length} label="Sessions" />
        <Stat value={xp > 0 ? `+${xp}` : 0} label="XP" />
        <Stat value={`${days.length}/7`} label="Days" />
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
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {aspectXp.map((a) => (
              <li key={a.aspect} className="flex items-center gap-1 text-xs text-gray-600 dark:text-[var(--muted)]">
                <span style={{ color: ACTIVITY_META[a.aspect].cssColorVar }}>{ACTIVITY_META[a.aspect].icon}</span>
                {ACTIVITY_META[a.aspect].label}
                <span className="font-semibold tabular-nums text-gray-800 dark:text-[var(--foreground)]">{a.xp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {topActivity && (
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-[var(--dark-3)]/40">
          <span className="text-2xl" aria-hidden="true">{topActivity.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[var(--muted)]">
              Top activity
            </p>
            <p className="truncate text-sm font-semibold text-gray-800 dark:text-[var(--foreground)]">{topActivity.name}</p>
          </div>
          <span className="text-sm font-bold tabular-nums text-gray-800 dark:text-[var(--foreground)]">
            {formatShortDuration(topActivity.seconds)}
          </span>
        </div>
      )}
    </div>
  );
}
