"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  ChevronLeft,
  Flame,
  HeartCrack,
  History,
  Info,
  Lock,
  Palmtree,
  RotateCcw,
  Snowflake,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { useMasteryAccent } from "@/src/lib/hooks/useMasteryAccent";
import StreakProtection, { streakRequest, type StreakStatus } from "@/src/components/settings/StreakProtection";
import StreakRulesPopup from "@/src/components/streaks/StreakRulesPopup";
import { FREEZE_COLOR, flameColor } from "@/src/components/streaks/flames";

type Event = { id: number; kind: string; day: string; details: Record<string, string | number | boolean> };
type Timeline = { events: Event[]; next_cursor: number | null };

const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-[var(--border)] dark:bg-dark-2";
const muted = "text-gray-500 dark:text-[var(--muted)]";
const VACATION_COLOR = "#10b981";

// ---------- dates (timeline days are local-timezone YYYY-MM-DD strings) ----------

const pad = (n: number) => String(n).padStart(2, "0");
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function fromYmd(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function relativeDay(day: string) {
  const date = fromYmd(day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return date.toLocaleDateString(undefined, { weekday: "long" });
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
}

// ---------- timeline event presentation ----------

function describe(event: Event): { icon: ReactNode; color: string; title: string; subtitle: string } {
  const d = event.details;
  const plural = (n: unknown, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  switch (event.kind) {
    case "activity":
      return { icon: <Flame className="h-4 w-4 fill-current" />, color: "#f97316", title: `Day ${d.count}`, subtitle: "Session completed" };
    case "broken":
      return { icon: <HeartCrack className="h-4 w-4" />, color: "#ef4444", title: `${d.count}-day streak ended`, subtitle: "Comeback quest started" };
    case "freeze_used":
      return {
        icon: <Snowflake className="h-4 w-4" />, color: FREEZE_COLOR,
        title: `${plural(d.used, "freeze")} used`,
        subtitle: d.preserved ? `${d.remaining} remaining` : "Not enough freezes, so the streak ended",
      };
    case "freeze_earned":
      return { icon: <Snowflake className="h-4 w-4" />, color: FREEZE_COLOR, title: "Freeze earned", subtitle: `${d.remaining} available` };
    case "vacation_started":
      return { icon: <Palmtree className="h-4 w-4" />, color: VACATION_COLOR, title: "Vacation started", subtitle: "Streak paused" };
    case "vacation_ended":
      return { icon: <Palmtree className="h-4 w-4" />, color: VACATION_COLOR, title: "Back from vacation", subtitle: "Return day protected" };
    case "restored":
      return { icon: <RotateCcw className="h-4 w-4" />, color: "#a78bfa", title: "Streak restored", subtitle: `${d.restored_days} days back · ${d.total} days total` };
    case "flame_unlocked":
      return { icon: <Flame className="h-4 w-4 fill-current" />, color: flameColor(String(d.name)), title: `${d.name} flame unlocked`, subtitle: `Reached ${d.days} days` };
    case "comeback_completed":
      return { icon: <Award className="h-4 w-4" />, color: "#f59e0b", title: "Comeback badge earned", subtitle: `Comeback #${d.number}` };
    default:
      return { icon: <History className="h-4 w-4" />, color: "#6b7280", title: "Streak updated", subtitle: "" };
  }
}

// ---------- small pieces ----------

function ProgressBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-dark-3"
    >
      <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function InfoButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`cursor-pointer rounded-full p-1 transition hover:bg-gray-100 dark:hover:bg-dark-3 ${muted}`}
    >
      <Info className="h-4 w-4" />
    </button>
  );
}

function StatusPill({ data }: { data: StreakStatus }) {
  const pill = data.vacation_mode
    ? { label: "On vacation", color: VACATION_COLOR }
    : data.streak_frozen
      ? { label: "Protected by freeze", color: FREEZE_COLOR }
      : data.streak_count > 0
        ? { label: "Active", color: "#f97316" }
        : { label: "Not started", color: "#6b7280" };
  return (
    <span
      className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: pill.color, backgroundColor: `${pill.color}1a` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pill.color }} />
      {pill.label}
    </span>
  );
}

// ---------- sections ----------

function WeekStrip({ events, flame }: { events: Event[]; flame: string }) {
  const kindsByDay = new Map<string, Set<string>>();
  for (const event of events) {
    if (!kindsByDay.has(event.day)) kindsByDay.set(event.day, new Set());
    kindsByDay.get(event.day)!.add(event.kind);
  }
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });
  const color = flameColor(flame);

  return (
    <div className="flex gap-1.5 sm:gap-2" aria-label="Last 7 days">
      {days.map((date, i) => {
        const kinds = kindsByDay.get(toYmd(date));
        const lit = kinds?.has("activity") || kinds?.has("restored");
        const frozen = !lit && kinds?.has("freeze_used");
        const vacation = !lit && !frozen && (kinds?.has("vacation_started") || kinds?.has("vacation_ended"));
        const isToday = i === 6;
        const tint = lit ? color : frozen ? FREEZE_COLOR : vacation ? VACATION_COLOR : null;
        const state = lit ? "active" : frozen ? "protected by a freeze" : vacation ? "vacation" : "no activity";
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <span className={`text-[11px] font-semibold ${isToday ? "text-black dark:text-[var(--foreground)]" : muted}`}>
              {date.toLocaleDateString(undefined, { weekday: "narrow" })}
            </span>
            <span
              title={`${date.toLocaleDateString(undefined, { weekday: "long" })}: ${state}`}
              className={`flex h-9 w-full max-w-11 items-center justify-center rounded-xl border ${
                tint ? "" : "border-gray-200 bg-gray-50 dark:border-[var(--border)] dark:bg-dark-3/50"
              } ${isToday && !tint ? "border-dashed border-gray-400 dark:border-gray-500" : ""}`}
              style={tint ? { color: tint, backgroundColor: `${tint}1f`, borderColor: `${tint}55` } : undefined}
            >
              {lit && <Flame className="h-4 w-4 fill-current" aria-hidden="true" />}
              {frozen && <Snowflake className="h-4 w-4" aria-hidden="true" />}
              {vacation && <Palmtree className="h-4 w-4" aria-hidden="true" />}
              <span className="sr-only">{state}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Hero({
  data,
  events,
  isMastery,
  masteryTitle,
  accentHex,
  primary,
}: {
  data: StreakStatus;
  events: Event[];
  isMastery: boolean;
  masteryTitle?: string;
  accentHex: string;
  primary: string;
}) {
  const color = flameColor(data.flame.name);
  const next = data.flame_levels.find((level) => !level.unlocked);
  const alive = data.streak_count > 0 || data.vacation_mode;
  const heroStyle: CSSProperties | undefined = isMastery
    ? {
        borderColor: `${accentHex}66`,
        backgroundImage: `radial-gradient(120% 90% at 0% 0%, ${accentHex}2e 0%, transparent 60%)`,
      }
    : undefined;

  return (
    <section className={`${card} relative overflow-hidden`} style={heroStyle} aria-label="Current streak">
      <div className="xl:grid xl:grid-cols-[auto_minmax(0,1fr)] xl:items-center xl:gap-10">
      <div className="flex items-center gap-5 sm:gap-7">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center sm:h-32 sm:w-32">
          <div
            aria-hidden="true"
            className={`absolute inset-2 rounded-full blur-2xl ${alive ? "motion-safe:animate-pulse" : ""}`}
            style={{ backgroundColor: alive ? color : "#6b7280", opacity: alive ? 0.35 : 0.12 }}
          />
          <Flame
            aria-hidden="true"
            className="relative h-24 w-24 fill-current sm:h-28 sm:w-28"
            strokeWidth={1}
            style={{ color: alive ? color : "#6b7280" }}
          />
        </div>

        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold" style={{ color }}>
            {data.flame.name} flame
            {isMastery && masteryTitle && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: accentHex, backgroundColor: `${accentHex}1f` }}
              >
                {masteryTitle}
              </span>
            )}
          </p>
          <p className="mt-0.5 flex items-baseline gap-2">
            <span className="text-6xl font-extrabold leading-none tabular-nums text-black dark:text-[var(--foreground)]">
              {data.streak_count}
            </span>
            <span className={`text-base font-medium ${muted}`}>day{data.streak_count === 1 ? "" : "s"}</span>
          </p>
          <p className={`mt-2 text-sm ${muted}`}>
            Personal best <b className="text-black dark:text-[var(--foreground)]">{data.streak_best}</b>
          </p>
        </div>
      </div>

      <div className="min-w-0">
      {next && (
        <div className="mt-5 xl:mt-0">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
            <span className={muted}>
              {Math.max(0, next.days - data.streak_count)} more {next.days - data.streak_count === 1 ? "day" : "days"} to{" "}
              <b style={{ color: flameColor(next.name) }}>{next.name}</b>
            </span>
            <span className={`tabular-nums ${muted}`}>
              {data.streak_count}/{next.days}
            </span>
          </div>
          <ProgressBar value={data.streak_count} max={next.days} color={primary} label={`Progress to ${next.name} flame`} />
        </div>
      )}

      <div className="mt-5 border-t border-gray-100 pt-4 dark:border-[var(--border)]">
        <WeekStrip events={events} flame={data.flame.name} />
      </div>
      </div>
      </div>
    </section>
  );
}

function FlameEvolution({ data, primary, onInfo }: { data: StreakStatus; primary: string; onInfo: () => void }) {
  const levels = data.flame_levels;
  // Segment i connects level i to i+1. Unlocked flames stay unlocked after a
  // break, so a segment is full once the next flame is unlocked; otherwise it
  // shows live progress of the current streak.
  const segmentFill = (i: number) => {
    const from = levels[i];
    const to = levels[i + 1];
    if (to.unlocked) return 1;
    if (!from.unlocked) return 0;
    return Math.min(1, Math.max(0, (data.streak_count - from.days) / (to.days - from.days)));
  };

  return (
    <section className={card} aria-labelledby="flames-title">
      <div className="flex items-center justify-between">
        <h2 id="flames-title" className="text-base font-semibold">Flame evolution</h2>
        <InfoButton onClick={onInfo} label="How flames work" />
      </div>

      <ol className="mt-4 flex items-start">
        {levels.map((level, i) => {
          const isCurrent = level.name === data.flame.name;
          const color = flameColor(level.name);
          return (
            <li key={level.name} className="relative flex flex-1 flex-col items-center text-center">
              {i < levels.length - 1 && (
                <div aria-hidden="true" className="absolute left-1/2 right-[-50%] top-6 h-1 -translate-y-1/2 px-7">
                  <div className="h-full w-full overflow-hidden rounded-full bg-gray-200 dark:bg-dark-3">
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${segmentFill(i) * 100}%`, backgroundColor: primary }} />
                  </div>
                </div>
              )}
              <span
                className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                  level.unlocked ? "" : "border-gray-200 bg-gray-50 text-gray-400 dark:border-[var(--border)] dark:bg-dark-3"
                }`}
                style={level.unlocked
                  ? {
                      color,
                      borderColor: isCurrent ? color : `${color}55`,
                      backgroundColor: `${color}1f`,
                      boxShadow: isCurrent ? `0 0 18px ${color}66` : undefined,
                    }
                  : undefined}
              >
                {level.unlocked ? <Flame className="h-5 w-5 fill-current" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
              </span>
              <span className={`mt-2 text-sm font-semibold ${level.unlocked ? "text-black dark:text-[var(--foreground)]" : muted}`}>
                {level.name}
              </span>
              <span className={`text-xs ${muted}`}>
                {level.days === 0 ? "Start" : `${level.days} days`}
                <span className="sr-only">{level.unlocked ? ", unlocked" : ", locked"}{isCurrent ? ", current" : ""}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function QuestCard({
  icon,
  iconColor,
  title,
  status,
  value,
  max,
  barColor,
  footer,
}: {
  icon: ReactNode;
  iconColor: string;
  title: string;
  status: string;
  value: number;
  max: number;
  barColor: string;
  footer?: ReactNode;
}) {
  return (
    <article className={`${card} flex flex-col`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color: iconColor, backgroundColor: `${iconColor}1a` }}>
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className={`text-xs ${muted}`}>{status}</p>
        </div>
        <span className="ml-auto text-sm font-bold tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="mt-3">
        <ProgressBar value={value} max={max} color={barColor} label={title} />
      </div>
      {footer && <div className={`mt-3 text-xs ${muted}`}>{footer}</div>}
    </article>
  );
}

function Quests({ data, primary, onInfo }: { data: StreakStatus; primary: string; onInfo: () => void }) {
  const { comeback } = data;
  const freezesFull = data.streak_freezes >= data.earned_freeze_cap;
  return (
    <section aria-labelledby="quests-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="quests-title" className="text-base font-semibold">Quests</h2>
        <InfoButton onClick={onInfo} label="How quests work" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <QuestCard
          icon={<Award className="h-5 w-5" />}
          iconColor="#f59e0b"
          title="Make a comeback"
          status={comeback.active ? "Show up on separate days" : "Unlocks after a streak breaks"}
          value={comeback.active ? comeback.progress : 0}
          max={comeback.target}
          barColor={primary}
          footer={
            <span className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              {comeback.completed} {comeback.completed === 1 ? "badge" : "badges"} earned
            </span>
          }
        />
        <QuestCard
          icon={<Snowflake className="h-5 w-5" />}
          iconColor={FREEZE_COLOR}
          title="Build your safety net"
          status={freezesFull ? "Both freeze slots are full" : data.vacation_mode ? "Paused while on vacation" : "Earn your next freeze"}
          value={freezesFull ? data.freeze_earning_days : data.streak_freeze_progress}
          max={data.freeze_earning_days}
          barColor={FREEZE_COLOR}
          footer={
            !freezesFull && (
              <Link href="/goals" className="inline-flex items-center gap-1 font-semibold text-black hover:underline dark:text-[var(--foreground)]">
                Start a session <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )
          }
        />
      </div>
    </section>
  );
}

const TIMELINE_PREVIEW = 5;

function StreakTimeline({ timeline }: { timeline: ReturnType<typeof useStreakTimeline> }) {
  const [expanded, setExpanded] = useState(false);
  const events = timeline.data?.pages.flatMap((page) => page.events) ?? [];
  const visible = expanded ? events : events.slice(0, TIMELINE_PREVIEW);
  const canShowMore = !expanded ? events.length > TIMELINE_PREVIEW || timeline.hasNextPage : timeline.hasNextPage;

  return (
    <section className={card} aria-labelledby="timeline-title">
      <h2 id="timeline-title" className="flex items-center gap-2 text-base font-semibold">
        <History className={`h-4 w-4 ${muted}`} aria-hidden="true" />
        Timeline
      </h2>

      {timeline.isPending ? (
        <div className="mt-5 space-y-6 animate-pulse" role="status" aria-label="Loading timeline">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-dark-3" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-16 rounded bg-gray-200 dark:bg-dark-3" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-dark-3" />
              </div>
            </div>
          ))}
        </div>
      ) : timeline.isError ? (
        <p className={`mt-4 text-sm ${muted}`} role="alert">
          Couldn’t load the timeline.{" "}
          <button onClick={() => void timeline.refetch()} className="cursor-pointer font-semibold underline">Try again</button>
        </p>
      ) : events.length === 0 ? (
        <p className={`mt-4 text-sm ${muted}`}>Complete a session and it’ll show up here.</p>
      ) : (
        <ol className="relative mt-5">
          {/* The rail runs behind the markers, from the first to the last one. */}
          {visible.length > 1 && <span aria-hidden="true" className="absolute bottom-3 left-[5px] top-1.5 w-px bg-gray-200 dark:bg-[var(--border)]" />}
          {visible.map((event, i) => {
            const item = describe(event);
            const latest = i === 0;
            return (
              <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                <span
                  aria-hidden="true"
                  className="relative mt-[3px] h-[11px] w-[11px] shrink-0 rounded-full border-2 bg-white dark:bg-dark-2"
                  style={
                    latest
                      ? { borderColor: item.color, boxShadow: `0 0 0 4px ${item.color}26, 0 0 12px ${item.color}80` }
                      : { borderColor: "#6b7280" }
                  }
                />
                <div className="min-w-0 flex-1">
                  <time
                    dateTime={event.day}
                    className={`block text-[11px] font-semibold uppercase tracking-wider ${muted}`}
                  >
                    {relativeDay(event.day)}
                  </time>
                  <p className="mt-1 flex items-center gap-1.5 text-sm">
                    <span className="shrink-0" style={{ color: item.color }} aria-hidden="true">{item.icon}</span>
                    <span className="font-semibold">{item.title}</span>
                    {item.subtitle && <span className={`truncate ${muted}`}>· {item.subtitle}</span>}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {(canShowMore || expanded) && events.length > 0 && (
        <div className="mt-5 flex gap-2">
          {canShowMore && (
            <button
              type="button"
              disabled={timeline.isFetchingNextPage}
              className="flex-1 cursor-pointer rounded-xl border border-dashed border-gray-300 py-2.5 text-sm font-semibold text-gray-500 transition hover:border-gray-400 hover:text-gray-700 disabled:opacity-50 dark:border-[var(--border)] dark:text-[var(--muted)] dark:hover:text-[var(--foreground)]"
              onClick={() => {
                if (!expanded) setExpanded(true);
                else void timeline.fetchNextPage();
              }}
            >
              {timeline.isFetchingNextPage ? "Loading…" : expanded ? "Show older" : "Show more"}
            </button>
          )}
          {expanded && (
            <button
              type="button"
              className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-[var(--muted)] dark:hover:bg-dark-3 dark:hover:text-[var(--foreground)]"
              onClick={() => setExpanded(false)}
            >
              Show less
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function HeroSkeleton() {
  return (
    <div className={`${card} animate-pulse`}>
      <div className="flex items-center gap-6">
        <div className="h-28 w-28 rounded-full bg-gray-200 dark:bg-dark-3" />
        <div className="space-y-3">
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-dark-3" />
          <div className="h-12 w-24 rounded bg-gray-200 dark:bg-dark-3" />
          <div className="h-3 w-28 rounded bg-gray-200 dark:bg-dark-3" />
        </div>
      </div>
      <div className="mt-6 h-2 rounded-full bg-gray-200 dark:bg-dark-3" />
      <div className="mt-5 flex gap-2">
        {Array.from({ length: 7 }, (_, i) => <div key={i} className="h-9 flex-1 rounded-xl bg-gray-200 dark:bg-dark-3" />)}
      </div>
    </div>
  );
}

// ---------- page ----------

function useStreakTimeline(userId: number | undefined) {
  return useInfiniteQuery({
    queryKey: ["streak-timeline", userId],
    enabled: !!userId,
    initialPageParam: null as number | null,
    queryFn: async ({ pageParam }): Promise<Timeline> => {
      const response = await authedFetch(`/api/streak/timeline${pageParam ? `?before=${pageParam}` : ""}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Couldn’t load your timeline.");
      return response.json();
    },
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    refetchInterval: 30_000,
  });
}

export default function StreaksPage() {
  const router = useRouter();
  const { me } = useAuth();
  const accent = useMasteryAccent();
  const isMastery = !!me?.masteryTitle && me.masteryTitle !== "Rookie";
  const primary = isMastery ? accent.primary : "var(--rookie-primary)";
  const [rulesOpen, setRulesOpen] = useState(false);

  const status = useQuery({ queryKey: ["streak", me?.id], queryFn: () => streakRequest(), enabled: !!me, refetchInterval: 30_000 });
  const timeline = useStreakTimeline(me?.id);
  const data = status.data;
  const recentEvents = timeline.data?.pages[0]?.events ?? [];

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 py-5 pb-24 text-black md:px-8 dark:text-[var(--foreground)]">
      {/* Title */}
      <header className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="-ml-1 cursor-pointer rounded-lg p-1.5 transition hover:bg-gray-200 md:hidden dark:hover:bg-dark-3"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Streaks</h1>
        {data && <StatusPill data={data} />}
        <div className="ml-auto">
          <InfoButton onClick={() => setRulesOpen(true)} label="How streaks work" />
        </div>
      </header>

      {/* Two independent columns on desktop; on mobile they stack, so
          Protection (the page's actions) comes before the timeline. */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          {status.isPending ? (
            <>
              <HeroSkeleton />
              <div className={`${card} h-36 animate-pulse`} />
            </>
          ) : status.isError || !data ? (
            <div role="alert" className={`${card} text-sm`}>
              <p className={muted}>Couldn’t load your streak.</p>
              <button className="mt-2 cursor-pointer font-semibold underline" onClick={() => void status.refetch()}>Try again</button>
            </div>
          ) : (
            <>
              <Hero
                data={data}
                events={recentEvents}
                isMastery={isMastery}
                masteryTitle={me?.masteryTitle}
                accentHex={accent.primary}
                primary={primary}
              />
              <FlameEvolution data={data} primary={primary} onInfo={() => setRulesOpen(true)} />
              <Quests data={data} primary={primary} onInfo={() => setRulesOpen(true)} />
            </>
          )}
        </div>

        <aside className="space-y-4">
          <StreakProtection />
          <StreakTimeline timeline={timeline} />
        </aside>
      </div>

      <StreakRulesPopup
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
        freezeEarningDays={data?.freeze_earning_days ?? 7}
        freezeCap={data?.earned_freeze_cap ?? 2}
      />
    </div>
  );
}
