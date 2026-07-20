"use client";

import { LiveAvatar } from "@/src/components/LiveAvatar";
import { supabase } from "@/src/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";

type InteractionType = "nudge" | "like";

type Interactions = {
  id: string;
  image: string;
  username: string;

  type: InteractionType;

  goalTitle?: string;
  activityName?: string;

  date: string;
  href: string;
  rounded?: boolean;
};

type InteractionResponse = {
  id?: unknown;
  actor?: unknown;
  interaction_type?: unknown;
  goal?: unknown;
  created_at?: unknown;
};

export function NudgesLikesSection() {
  const [interactions, setInteractions] = useState<Interactions[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const res = await fetch("/api/goals/interactions/recent", {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch interactions");

        const data = await res.json();

        console.log("Fetched interactions:", data);

        const results = Array.isArray(data.results) ? data.results : [];
        const mapped: Interactions[] = results.map(
          (raw: InteractionResponse) => {
            const actor =
              raw.actor && typeof raw.actor === "object"
                ? (raw.actor as Record<string, unknown>)
                : null;
            const goal =
              raw.goal && typeof raw.goal === "object"
                ? (raw.goal as Record<string, unknown>)
                : null;
            const type: InteractionType =
              raw.interaction_type === "nudge" ? "nudge" : "like";

            return {
              id: String(raw.id),
              image:
                typeof actor?.profile_picture === "string"
                  ? actor.profile_picture
                  : "",
              username:
                typeof actor?.username === "string"
                  ? actor.username
                  : "Unknown",
              type,
              goalTitle:
                typeof goal?.title === "string" ? goal.title : undefined,
              activityName: undefined,
              date:
                typeof raw.created_at === "string"
                  ? formatTimeAgo(raw.created_at)
                  : "",
              href: typeof goal?.uid === "string" ? `/goals/${goal.uid}` : "#",
              rounded: true,
            };
          },
        );

        setInteractions(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, []);

  return (
    <>
      {/* NOTIFICATIONS */}
      <div className="bg-white w-full p-6 mb-4 rounded-xl border-2 border-gray-200 dark:bg-dark-2 dark:border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <p className="text-md font-semibold dark:text-[var(--foreground)]">
            Recent Interactions
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto scrollbar-hide">
          <ul className="flex flex-col gap-4 h-16 p-2">
            {interactions.map((i) => (
              <Link key={i.id} href={i.href}>
                <li className="cursor-pointer">
                  <div className="flex gap-4">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <LiveAvatar username={i.rounded ? i.username : undefined}>
                        <img
                          src={i.image}
                          className={`h-12 w-12 object-cover aspect-square ${
                            i.rounded ? "rounded-full" : "rounded-md"
                          }`}
                          loading="lazy"
                          alt="profile"
                        />
                      </LiveAvatar>

                      {/* Emoji badge, bottom-right — the live-status dot now
                          lives on the bottom-left consistently everywhere, so
                          this corner is always free. */}
                      <div
                        className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-[16px] bg-white border"
                        style={{ borderColor: "var(--border)" }}
                      >
                        {i.type === "nudge" ? "👋" : "❤️"}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-base dark:text-[var(--foreground)] truncate">
                        <span className="font-semibold">{i.username}</span>{" "}
                        {i.type === "nudge" ? (
                          <>
                            nudged you during your{" "}
                            <span className="font-semibold">
                              {i.activityName ?? "session"}
                            </span>{" "}
                          </>
                        ) : (
                          <>
                            liked{" "}
                            <span className="font-semibold">
                              {i.goalTitle ?? ""}
                            </span>{" "}
                          </>
                        )}
                      </p>

                      <p className="text-gray-500 text-xs">{i.date}</p>
                    </div>
                  </div>
                </li>
              </Link>
            ))}

            {loading &&
              interactions.length === 0 &&
              Array.from({ length: 3 }).map((_, i) => (
                <li key={`skeleton-${i}`} className="animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-dark-3 shrink-0" />
                    <div className="flex flex-col gap-2 flex-1 justify-center">
                      <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-dark-3" />
                      <div className="h-2 w-1/4 rounded bg-gray-200 dark:bg-dark-3" />
                    </div>
                  </div>
                </li>
              ))}

            {!loading && interactions.length === 0 && (
              <li className="text-sm text-gray-400">No recent interactions</li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

  return `${Math.floor(diff / 86400)}d ago`;
}
