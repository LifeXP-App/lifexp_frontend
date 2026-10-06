"use client";

import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Flame, LockKeyhole, Award, Snowflake, History } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { authedFetch } from "@/src/lib/api/authedFetch";
import StreakProtection, { streakRequest } from "@/src/components/settings/StreakProtection";

type Event = { id: number; kind: string; day: string; details: Record<string, string | number | boolean> };
type Timeline = { events: Event[]; next_cursor: number | null };
const colors: Record<string, string> = { Spark: "text-amber-500", Kindled: "text-orange-500", Blaze: "text-red-500", Inferno: "text-violet-500" };
const card = "rounded-2xl border border-gray-200 bg-white p-5 dark:border-[var(--border)] dark:bg-dark-2";
function describe(event: Event) {
  const d = event.details;
  switch (event.kind) {
    case "activity": return `Activity completed · ${d.count}-day streak`;
    case "broken": return `${d.count}-day streak ended · comeback quest started`;
    case "freeze_used": return `${d.used} freeze(s) used · ${d.remaining} remaining${d.preserved ? "" : " · further missed days ended the streak"}`;
    case "freeze_earned": return `Freeze earned · ${d.remaining} available`;
    case "vacation_started": return "Vacation started · streak paused";
    case "vacation_ended": return "Vacation ended · return day protected";
    case "restored": return `Latest ${d.restored_days}-day streak restored · ${d.total} days including current progress`;
    case "flame_unlocked": return `${d.name} flame unlocked at ${d.days} days`;
    case "comeback_completed": return `Comeback badge earned · comeback #${d.number}`;
    default: return "Streak updated";
  }
}

export default function StreaksPage() {
  const { me } = useAuth();
  const status = useQuery({ queryKey: ["streak", me?.id], queryFn: () => streakRequest(), enabled: !!me, refetchInterval: 30_000 });
  const timeline = useInfiniteQuery({
    queryKey: ["streak-timeline", me?.id], enabled: !!me, initialPageParam: null as number | null,
    queryFn: async ({ pageParam }): Promise<Timeline> => {
      const response = await authedFetch(`/api/streak/timeline${pageParam ? `?before=${pageParam}` : ""}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Couldn’t load your timeline.");
      return response.json();
    },
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    refetchInterval: 30_000,
  });
  const data = status.data;
  const events = timeline.data?.pages.flatMap((page) => page.events) ?? [];
  return <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 pb-24 text-gray-900 dark:text-[var(--foreground)]">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-orange-600 dark:text-orange-400">One day at a time</p><h1 className="mt-2 text-3xl font-bold">Your streak</h1><p className="mt-2 text-sm opacity-70">Build a rhythm, protect your progress, and find your way back.</p></header>
    {status.isPending ? <p role="status">Loading your streak…</p> : status.isError ? <div role="alert">Couldn’t load your streak. <button className="underline" onClick={() => void status.refetch()}>Try again</button></div> : data && <>
      <section className={`${card} flex flex-wrap items-center gap-6`} aria-label="Current streak and flame">
        <Flame aria-hidden="true" className={`h-24 w-24 shrink-0 fill-current ${colors[data.flame.name] ?? colors.Spark}`} strokeWidth={1} />
        <div><p className="text-sm font-medium">{data.flame.name} flame{data.vacation_mode ? " · Streak paused" : ""}</p><p className="mt-1 text-5xl font-bold tabular-nums">{data.streak_count} <span className="text-lg font-normal">days</span></p><p className="mt-2 text-sm opacity-70">Personal best: {data.streak_best} days</p></div>
      </section>
      <section className={card} aria-labelledby="flames-title"><h2 id="flames-title" className="text-lg font-semibold">Flame evolution</h2><p className="mt-1 text-sm opacity-70">Reach 7, 30, and 100 streak days to evolve your flame. Unlocked appearances stay yours after a break. Your strongest unlocked flame is shown above.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{data.flame_levels.map((level) => <div key={level.name} className={`rounded-xl border p-4 ${level.unlocked ? "border-orange-200 dark:border-orange-900" : "border-gray-200 dark:border-[var(--border)]"}`}>
          <Flame aria-hidden="true" className={`mb-2 h-8 w-8 ${level.unlocked ? `fill-current ${colors[level.name]}` : "text-gray-400"}`} />
          <p className="font-semibold">{level.name}</p><p className="text-xs opacity-70">{level.days === 0 ? "Your starting flame" : `${level.days} streak days`}</p>
          <p className="mt-2 flex items-center gap-1 text-xs">{level.unlocked ? "Unlocked" : <><LockKeyhole size={12} aria-hidden="true" />Locked</>}</p>
        </div>)}</div>
      </section>
      <section aria-labelledby="quests-title"><h2 id="quests-title" className="mb-3 text-lg font-semibold">Streak quests</h2><div className="grid gap-4 sm:grid-cols-2">
        <article className={card}><Award className="mb-3 text-orange-500" aria-hidden="true" /><h3 className="font-semibold">Make a comeback</h3><p className="mt-2 text-sm opacity-70">After a streak breaks, complete sessions on three separate days to earn a comeback badge. Another break restarts the quest; earned badges stay. Vacation and restorations don’t count as activity.</p><p className="mt-3 text-sm font-medium">{data.comeback.active ? `${data.comeback.progress} / ${data.comeback.target} activity days` : data.comeback.completed ? "Comeback complete" : "Starts after a streak breaks"}</p><progress aria-label="Comeback quest" className="mt-2 h-2 w-full accent-orange-500" value={data.comeback.progress} max={data.comeback.target} /><p className="mt-2 text-xs opacity-70">{data.comeback.completed} comeback badges earned</p></article>
        <article className={card}><Snowflake className="mb-3 text-sky-500" aria-hidden="true" /><h3 className="font-semibold">Build your safety net</h3><p className="mt-2 text-sm opacity-70">Complete sessions on {data.freeze_earning_days} distinct activity days to earn a freeze. Progress pauses on vacation or when your two slots are full.</p><p className="mt-3 text-sm font-medium">{data.streak_freezes >= data.earned_freeze_cap ? "Both freeze slots are full" : `${data.streak_freeze_progress} / ${data.freeze_earning_days} activity days`}</p><progress aria-label="Freeze quest" className="mt-2 h-2 w-full accent-sky-500" value={data.streak_freeze_progress} max={data.freeze_earning_days} /><Link href="/goals" className="mt-4 inline-block text-sm font-semibold underline">Choose an activity →</Link></article>
      </div></section>
      <StreakProtection />
    </>}
    <section className={card} aria-labelledby="timeline-title"><h2 id="timeline-title" className="flex items-center gap-2 text-lg font-semibold"><History size={20} aria-hidden="true" />Streak timeline</h2><p className="mt-1 text-sm opacity-70">Your activity days, freezes, vacations, and restorations in your local timezone. History starts with this feature; older days aren’t reconstructed.</p>
      {timeline.isPending ? <p className="mt-4" role="status">Loading timeline…</p> : timeline.isError ? <p className="mt-4" role="alert">Couldn’t load the timeline. <button onClick={() => void timeline.refetch()} className="underline">Try again</button></p> : events.length === 0 ? <p className="mt-5 text-sm opacity-70">Your next streak activity will appear here.</p> : <ol className="mt-5 divide-y divide-gray-100 dark:divide-[var(--border)]">{events.map((event) => <li key={event.id} className="py-3"><time className="text-xs opacity-60" dateTime={event.day}>{event.day}</time><p className="mt-1 text-sm">{describe(event)}</p></li>)}</ol>}
      {timeline.hasNextPage && <button disabled={timeline.isFetchingNextPage} className="mt-4 rounded-lg border px-4 py-2 text-sm disabled:opacity-50" onClick={() => void timeline.fetchNextPage()}>{timeline.isFetchingNextPage ? "Loading…" : "Show older events"}</button>}
    </section>
  </main>;
}
