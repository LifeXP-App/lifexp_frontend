"use client";

import Image from "next/image";
import { ACTIVITY_META, type ActivityType } from "@/src/lib/types/activityMeta";

export type ProfileGoal = {
  uid: string;
  title: string;
  emoji?: string;
  description?: string;
  content?: string;
  coverImage?: string | null;
  totalXp: number;
  durationDisplay?: string;
  xpDistribution: Record<ActivityType, number>;
  sessionsCount?: number | null;
  lastSessionAt?: string | null;
  createdAt: string;
  completedAt?: string | null;
};

const ASPECTS: ActivityType[] = ["physique", "energy", "social", "creativity", "logic"];

// ---------- helpers ----------

function aspectBreakdown(distribution: Record<ActivityType, number>) {
  const parts = ASPECTS.map((aspect) => ({ aspect, xp: distribution?.[aspect] ?? 0 }))
    .filter((p) => p.xp > 0)
    .sort((a, b) => b.xp - a.xp);
  const total = parts.reduce((sum, p) => sum + p.xp, 0);
  return { parts, total, top: parts[0]?.aspect };
}

// rgb triple (as a CSS var) of the goal's dominant aspect, for tinting.
function aspectRgb(aspect: ActivityType | undefined): string {
  return aspect ? ACTIVITY_META[aspect].cssColorVarRgb : "var(--rookie-primary-rgb, 65, 104, 226)";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
}

function daysBetween(from: string, to: string): number {
  return Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000));
}

function sessionsLabel(count: number): string {
  return `${count} session${count === 1 ? "" : "s"}`;
}

function lastSessionLabel(value: string): { text: string; active: boolean } {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days < 1) return { text: "Active today", active: true };
  if (days === 1) return { text: "Last session yesterday", active: false };
  if (days < 30) return { text: `Last session ${days} days ago`, active: false };
  return { text: `Last session ${formatDate(value)}`, active: false };
}

// Completed-goal tiers, by total XP earned on the goal.
const TIERS = [
  { name: "Platinum", min: 2500, ring: "conic-gradient(from 210deg, #e0f7ff, #8fd8f0, #f3fbff, #7cc6e6, #e0f7ff)", text: "#7cc6e6" },
  { name: "Gold", min: 600, ring: "conic-gradient(from 210deg, #fff1b8, #e3a92c, #fde68a, #c98a12, #fff1b8)", text: "#e3a92c" },
  { name: "Silver", min: 150, ring: "conic-gradient(from 210deg, #f4f6f8, #a5adb8, #e6e9ed, #8b94a1, #f4f6f8)", text: "#a5adb8" },
  { name: "Bronze", min: 0, ring: "conic-gradient(from 210deg, #f3c9a0, #b86b2d, #e8b07c, #9a5520, #f3c9a0)", text: "#c27a3e" },
] as const;

function tierFor(xp: number) {
  return TIERS.find((tier) => xp >= tier.min) ?? TIERS[TIERS.length - 1];
}

function AspectBar({ distribution, className = "" }: { distribution: Record<ActivityType, number>; className?: string }) {
  const { parts, total } = aspectBreakdown(distribution);
  if (total === 0) return null;
  return (
    <div className={`flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-[var(--dark-3)] ${className}`}>
      {parts.map((p) => (
        <span
          key={p.aspect}
          style={{ width: `${(p.xp / total) * 100}%`, backgroundColor: ACTIVITY_META[p.aspect].cssColorVar }}
          title={`${ACTIVITY_META[p.aspect].label}: ${p.xp.toLocaleString()} XP`}
        />
      ))}
    </div>
  );
}

// Cover area: the goal's photo under an aspect-tinted gradient, or — when
// there's no photo, which is most goals — an aspect-colored gradient with a
// large faded emoji so the card never falls back to a flat grey block.
function GoalCover({ goal, rgb, className }: { goal: ProfileGoal; rgb: string; className: string }) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, rgba(${rgb}, 0.55), rgba(${rgb}, 0.12) 70%)` }}
    >
      {goal.coverImage ? (
        <Image src={goal.coverImage} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
      ) : (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 -top-4 select-none text-[88px] leading-none opacity-25 blur-[1px]"
          style={{ transform: "rotate(-12deg)" }}
        >
          {goal.emoji || "🏆"}
        </span>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(to bottom, rgba(${rgb}, 0.15), rgba(0, 0, 0, 0.55))` }}
      />
    </div>
  );
}

// ---------- completed: trophy badge ----------

export function CompletedGoalBadge({ goal }: { goal: ProfileGoal }) {
  const { top } = aspectBreakdown(goal.xpDistribution);
  const rgb = aspectRgb(top);
  const tier = tierFor(goal.totalXp);
  const shiny = tier.name === "Gold" || tier.name === "Platinum";
  const completedAt = goal.completedAt ?? null;
  const facts = [
    goal.sessionsCount != null ? sessionsLabel(goal.sessionsCount) : null,
    goal.durationDisplay || null,
  ].filter(Boolean);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-transform hover:-translate-y-0.5 dark:border-[var(--border)] dark:bg-[#151618]">
      <GoalCover goal={goal} rgb={rgb} className="h-20 shrink-0" />

      {shiny && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[400%]"
        />
      )}

      {/* Medallion: emoji inside a tier-colored ring, overlapping the cover. */}
      <div className="relative -mt-9 flex justify-center">
        <span className="rounded-full p-[3px] shadow-lg" style={{ background: tier.ring }}>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl dark:bg-[#151618]">
            {goal.emoji || "🏆"}
          </span>
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-1 px-3 pb-3 pt-2 text-center">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-black dark:text-[var(--foreground)]">
          {goal.title}
        </p>
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: tier.text }}>
          {tier.name} · {goal.totalXp.toLocaleString()} XP
        </p>
        {facts.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-[var(--muted)]">{facts.join(" · ")}</p>
        )}
        {completedAt && (
          <p className="text-xs text-gray-400 dark:text-[var(--muted)]/80">
            Done {formatDate(completedAt)} · in {daysBetween(goal.createdAt, completedAt)}d
          </p>
        )}
        <AspectBar distribution={goal.xpDistribution} className="mt-auto pt-0" />
      </div>
    </div>
  );
}

// ---------- ongoing: progress card ----------

export function OngoingGoalCard({ goal }: { goal: ProfileGoal }) {
  const { top } = aspectBreakdown(goal.xpDistribution);
  const rgb = aspectRgb(top);
  const last = goal.lastSessionAt ? lastSessionLabel(goal.lastSessionAt) : null;
  const description = goal.description || goal.content;

  return (
    <div className="flex h-full overflow-hidden rounded-2xl border border-gray-200 bg-white transition-transform hover:-translate-y-0.5 dark:border-[var(--border)] dark:bg-[#151618]">
      <div className="relative w-24 shrink-0 sm:w-28">
        <GoalCover goal={goal} rgb={rgb} className="absolute inset-0" />
        <span className="relative flex h-full items-center justify-center text-4xl drop-shadow-md">
          {goal.emoji || "🏆"}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-black dark:text-[var(--foreground)] sm:text-base">
            {goal.title}
          </p>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ backgroundColor: `rgba(${rgb}, 0.15)`, color: `rgb(${rgb})` }}
          >
            {goal.totalXp.toLocaleString()} XP
          </span>
        </div>

        {description && (
          <p className="line-clamp-1 text-xs text-gray-500 dark:text-[var(--muted)]">{description}</p>
        )}

        <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-[var(--muted)]">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            {last?.active && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${last?.active ? "bg-emerald-500" : "bg-gray-400"}`} />
          </span>
          {last ? last.text : "No sessions yet"}
        </p>

        <p className="text-xs text-gray-500 dark:text-[var(--muted)]">
          {[
            `Started ${formatDate(goal.createdAt)}`,
            goal.sessionsCount ? sessionsLabel(goal.sessionsCount) : null,
            goal.sessionsCount ? goal.durationDisplay : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <AspectBar distribution={goal.xpDistribution} className="mt-auto" />
      </div>
    </div>
  );
}
