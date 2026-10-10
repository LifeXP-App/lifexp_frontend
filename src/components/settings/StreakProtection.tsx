"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Snowflake, Palmtree, RotateCcw } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { authedFetch } from "@/src/lib/api/authedFetch";

export type StreakStatus = {
  streak_best: number;
  flame: { name: string; days: number };
  flame_levels: { name: string; days: number; unlocked: boolean }[];
  comeback: { active: boolean; progress: number; target: number; completed: number };
  streak_count: number;
  streak_freezes: number;
  streak_freeze_progress: number;
  freeze_earning_days: number;
  earned_freeze_cap: number;
  vacation_mode: boolean;
  streak_frozen: boolean;
  streak_restore_tokens: number;
  streak_before_break: number;
  can_restore: boolean;
};

export async function streakRequest(method = "GET", vacation?: boolean): Promise<StreakStatus> {
  const response = await authedFetch(method === "POST" ? "/api/streak/restore" : "/api/streak", {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "PATCH" ? JSON.stringify({ vacation_mode: vacation }) : undefined,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Unable to update streak protection.");
  return data;
}

export default function StreakProtection() {
  const { me, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const key = ["streak", me?.id];
  const { data, isPending, error, refetch } = useQuery({
    queryKey: key,
    queryFn: () => streakRequest(),
    enabled: !!me,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  async function update(method: "PATCH" | "POST", vacation?: boolean) {
    if (busy) return;
    if (method === "POST" && !window.confirm(
      `Use one token to restore your latest broken ${data?.streak_before_break}-day streak, not your personal best? Your current progress will be kept.`,
    )) return;
    setBusy(true);
    setMessage(null);
    try {
      const status = await streakRequest(method, vacation);
      queryClient.setQueryData(key, status);
      void queryClient.invalidateQueries({ queryKey: ["streak-timeline", me?.id] });
      setMessage(method === "POST" ? "Your streak has been restored." :
        status.vacation_mode ? "Vacation mode is on. Your streak is paused." : "Vacation mode is off. Today is protected.");
      void queryClient.invalidateQueries({ queryKey: ["user-profile-widget", me?.username] });
      // The mutation succeeded; a profile refresh cannot roll it back.
      void refreshMe().catch(() => {});
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="streak-protection-title" className="mb-8 rounded-lg border border-gray-200 p-5 text-black dark:border-[var(--border)] dark:text-[var(--foreground)]">
      <h2 id="streak-protection-title" className="mb-4 text-lg font-semibold">Streak protection</h2>
      {isPending ? <p role="status" className="text-sm opacity-70">Loading your streak…</p> : error ? (
        <div role="alert"><p className="text-sm">Couldn’t load streak protection.</p>
          <button type="button" onClick={() => void refetch()} className="mt-2 text-sm underline">Try again</button></div>
      ) : data ? (
        <div className="space-y-5">
          <p className="text-sm">Current streak: <strong>{data.streak_count} days</strong>{data.vacation_mode && " · Paused"}</p>
          {data.streak_frozen && <p role="status" className="rounded-md bg-sky-50 p-3 text-sm text-sky-800 dark:bg-sky-950 dark:text-sky-200">A freeze protected your streak. {data.streak_freezes} of {data.earned_freeze_cap} freezes remain.</p>}
          <div>
            <h3 className="flex items-center gap-2 font-medium"><Snowflake size={18} aria-hidden="true" />{data.streak_freezes} streak {data.streak_freezes === 1 ? "freeze" : "freezes"}</h3>
            <p className="mt-1 text-sm opacity-70">Each freeze automatically protects one missed day. Protected days do not add to your streak.</p>
            <p className="mt-2 text-sm">Complete sessions on {data.freeze_earning_days} days to earn a freeze. Store up to {data.earned_freeze_cap} freezes.</p>
            {data.streak_freezes < data.earned_freeze_cap ? (
              <div className="mt-2">
                <progress aria-label="Progress toward next streak freeze" className="h-2 w-full accent-sky-500" value={data.streak_freeze_progress} max={data.freeze_earning_days} />
                <p className="mt-1 text-xs opacity-70">{data.streak_freeze_progress} / {data.freeze_earning_days} activity days toward your next freeze</p>
              </div>
            ) : <p className="mt-2 text-xs opacity-70">Your freeze storage is full.</p>}
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 font-medium"><Palmtree size={18} aria-hidden="true" />Vacation mode</h3>
              <p id="vacation-description" className="mt-1 text-sm opacity-70">Pause your streak until you return. No freezes are spent, and streak growth and freeze earning pause too.</p>
            </div>
            <button type="button" role="switch" aria-checked={data.vacation_mode} aria-label="Vacation mode" aria-describedby="vacation-description" disabled={busy}
              onClick={() => void update("PATCH", !data.vacation_mode)}
              className="shrink-0 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-[var(--border)]">
              {data.vacation_mode ? "On" : "Off"}
            </button>
          </div>
          {data.streak_restore_tokens > 0 && <div>
            <h3 className="flex items-center gap-2 font-medium"><RotateCcw size={18} aria-hidden="true" />{data.streak_restore_tokens} restoration {data.streak_restore_tokens === 1 ? "token" : "tokens"}</h3>
            <p className="mt-1 text-sm opacity-70">A token restores your latest broken streak, not your personal best of {data.streak_best} days. Your current progress is kept. Tokens are separate from your two freezes.</p>
            {data.streak_before_break > 0 && <p className="mt-2 text-sm">Latest broken streak: {data.streak_before_break} days</p>}
            {data.streak_before_break === 0 && <p className="mt-2 text-sm opacity-70">There’s no broken streak to restore yet. Your token will stay available.</p>}
            <button type="button" disabled={busy || !data.can_restore} onClick={() => void update("POST")}
              className="mt-3 rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black">
              {busy ? "Updating…" : "Use a token to restore streak"}
            </button>
          </div>}
        </div>
      ) : null}
      {message && <p role="status" className="mt-4 text-sm">{message}</p>}
    </section>
  );
}
