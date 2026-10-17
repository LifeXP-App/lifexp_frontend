"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Snowflake, Palmtree, RotateCcw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useConfirm, useToast } from "@/src/context/ToastContext";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { useMasteryPrimaryColor } from "@/src/lib/hooks/useMasteryAccent";
import { FREEZE_COLOR } from "@/src/components/streaks/flames";

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

export function StreakProtectionSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 animate-pulse dark:border-[var(--border)] dark:bg-dark-2">
      <div className="mb-5 h-4 w-28 rounded bg-gray-200 dark:bg-dark-3" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-4 h-16 rounded-xl bg-gray-200 dark:bg-dark-3" />
      ))}
    </div>
  );
}

export default function StreakProtection() {
  const { me, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  const primary = useMasteryPrimaryColor();
  const [busy, setBusy] = useState(false);
  const key = ["streak", me?.id];
  const { data, isPending, error, refetch } = useQuery({
    queryKey: key,
    queryFn: () => streakRequest(),
    enabled: !!me,
    staleTime: 0,
    refetchInterval: 30_000,
  });

  async function update(method: "PATCH" | "POST", vacation?: boolean) {
    if (busy) return;
    if (method === "POST") {
      const ok = await confirm({
        title: "Restore streak",
        message: `Use one token to restore your latest broken ${data?.streak_before_break}-day streak? This isn’t your personal best, and your current progress will be kept.`,
        confirmText: "Restore",
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      const status = await streakRequest(method, vacation);
      queryClient.setQueryData(key, status);
      void queryClient.invalidateQueries({ queryKey: ["streak-timeline", me?.id] });
      toast.success(method === "POST" ? "Your streak has been restored." :
        status.vacation_mode ? "Vacation mode is on. Your streak is paused." : "Welcome back! Today is protected.");
      void queryClient.invalidateQueries({ queryKey: ["user-profile-widget", me?.username] });
      // The mutation succeeded; a profile refresh cannot roll it back.
      void refreshMe().catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (isPending) return <StreakProtectionSkeleton />;

  return (
    <section
      aria-labelledby="streak-protection-title"
      className="rounded-2xl border border-gray-200 bg-white p-5 text-black dark:border-[var(--border)] dark:bg-dark-2 dark:text-[var(--foreground)]"
    >
      <h2 id="streak-protection-title" className="flex items-center gap-2 text-base font-semibold">
        <ShieldCheck className="h-4 w-4 text-gray-500 dark:text-[var(--muted)]" aria-hidden="true" />
        Protection
      </h2>

      {error || !data ? (
        <div role="alert" className="mt-4">
          <p className="text-sm text-gray-500 dark:text-[var(--muted)]">Couldn’t load streak protection.</p>
          <button type="button" onClick={() => void refetch()} className="mt-2 cursor-pointer text-sm font-semibold underline">Try again</button>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-gray-100 dark:divide-[var(--border)]">
          {/* FREEZES */}
          <div className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Freezes</h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-[var(--muted)]">Each one covers a missed day.</p>
              </div>
              <div className="flex gap-1.5" aria-label={`${data.streak_freezes} of ${data.earned_freeze_cap} freezes available`} role="img">
                {Array.from({ length: data.earned_freeze_cap }, (_, i) => {
                  const filled = i < data.streak_freezes;
                  return (
                    <span
                      key={i}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors"
                      style={filled
                        ? { color: FREEZE_COLOR, backgroundColor: `${FREEZE_COLOR}1a`, borderColor: `${FREEZE_COLOR}66` }
                        : { color: "#6b7280", borderColor: "var(--border)", borderStyle: "dashed" }}
                    >
                      <Snowflake className="h-5 w-5" aria-hidden="true" strokeWidth={filled ? 2.25 : 1.5} />
                    </span>
                  );
                })}
              </div>
            </div>
            {data.streak_frozen && (
              <p role="status" className="mt-3 rounded-xl px-3 py-2 text-xs font-medium" style={{ color: FREEZE_COLOR, backgroundColor: `${FREEZE_COLOR}14` }}>
                A freeze saved your streak. {data.streak_freezes} of {data.earned_freeze_cap} left.
              </p>
            )}
          </div>

          {/* VACATION */}
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Palmtree className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">Vacation mode</h3>
                <p id="vacation-description" className="mt-0.5 text-xs text-gray-500 dark:text-[var(--muted)]">
                  {data.vacation_mode ? "Your streak is paused until you’re back." : "Pause your streak without spending freezes."}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={data.vacation_mode}
              aria-label="Vacation mode"
              aria-describedby="vacation-description"
              disabled={busy}
              onClick={() => void update("PATCH", !data.vacation_mode)}
              className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-gray-300 transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:bg-dark-3"
              style={data.vacation_mode ? { backgroundColor: primary } : undefined}
            >
              <span
                className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: data.vacation_mode ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
          </div>

          {/* RESTORE */}
          {data.streak_restore_tokens > 0 && (
            <div className="flex items-center gap-3 pt-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">
                  {data.streak_restore_tokens} restore {data.streak_restore_tokens === 1 ? "token" : "tokens"}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-[var(--muted)]">
                  {data.streak_before_break > 0
                    ? `Bring back your ${data.streak_before_break}-day streak.`
                    : "No broken streak to restore yet."}
                </p>
              </div>
              <button
                type="button"
                disabled={busy || !data.can_restore}
                onClick={() => void update("POST")}
                className="shrink-0 cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
                style={{ backgroundColor: primary }}
              >
                {busy ? "Updating…" : "Restore"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
