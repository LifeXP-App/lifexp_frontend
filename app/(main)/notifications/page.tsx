"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LiveAvatar } from "@/src/components/LiveAvatar";
import { useAuth } from "@/src/context/AuthContext";
import { authedFetch } from "@/src/lib/api/authedFetch";

type ApiNotification = {
  id: number | string;
  sender?: { username?: string; profile_picture?: string | null } | null;
  message?: string;
  created_at: string;
  is_read: boolean;
  link: string | null;
  notification_type?: string;
  image?: string | null;
};

type NotificationDisplay = {
  id: string;
  image: string;
  sender: string;
  text: string;
  date: string;
  href: string;
  rounded?: boolean;
  isRead: boolean;
};

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

export default function NotificationsPage() {
  const { me, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "full"],
    queryFn: async () => {
      const res = await authedFetch("/api/notifications?unread=false&limit=50", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) return { notifications: [] as NotificationDisplay[] };

      const raw = await res.json();
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.notifications)
          ? raw.notifications
          : Array.isArray(raw?.results)
            ? raw.results
            : [];

      const mapped = list.map((n: ApiNotification) => ({
        id: String(n.id),
        image: n.image || n.sender?.profile_picture || "",
        text: n.message || "",
        sender: n.sender?.username || " ",
        date: getTimeAgo(n.created_at),
        href: n.link || "/",
        rounded: n.notification_type === "follow",
        isRead: n.is_read,
      }));

      return { notifications: mapped as NotificationDisplay[] };
    },
    enabled: !authLoading && !!me,
    staleTime: 0,
  });

  const notifications = data?.notifications ?? [];

  return (
    <main className="min-h-screen w-full bg-gray-100 dark:bg-dark-1">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl font-semibold text-black dark:text-[var(--foreground)] mb-6">
          Notifications
        </h1>

        <div className="bg-white dark:bg-dark-2 rounded-xl border-2 border-gray-200 dark:border-[var(--border)] overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col gap-6 md:gap-4 p-6 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-[var(--dark-3)]" />
                  <div className="flex-1 flex flex-col gap-2 justify-center">
                    <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-[var(--dark-3)]" />
                    <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-[var(--dark-3)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-[var(--muted)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-12 h-12 mb-3 opacity-70"
              >
                <path d="M12 2a6 6 0 0 0-6 6v3.6l-1.8 3.6A1 1 0 0 0 5 17h14a1 1 0 0 0 .8-1.8L18 11.6V8a6 6 0 0 0-6-6zm0 20a3 3 0 0 0 2.83-2H9.17A3 3 0 0 0 12 22z" />
              </svg>
              <p className="text-base font-medium">No notifications</p>
              <p className="text-sm opacity-70">You&apos;re all caught up</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-[var(--border)] animate-content-in">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-dark-3 ${
                      n.isRead ? "" : "bg-blue-50/60 dark:bg-blue-500/5"
                    }`}
                  >
                    <LiveAvatar username={n.rounded ? n.sender : undefined}>
                      <Image
                        src={n.image || "/default_pfp.png"}
                        width={48}
                        height={48}
                        alt={n.sender}
                        className={`h-12 w-12 object-cover ${
                          n.rounded ? "rounded-full" : "rounded-md"
                        }`}
                      />
                    </LiveAvatar>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <p className="text-sm text-gray-900 dark:text-[var(--foreground)] truncate">
                        <span className="font-bold">{n.sender}</span>{" "}
                        <span className="font-medium">{n.text}</span>
                      </p>
                      <p className="text-gray-500 dark:text-[var(--muted)] text-xs mt-0.5">
                        {n.date}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
