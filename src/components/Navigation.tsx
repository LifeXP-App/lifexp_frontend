"use client";

import { LEADERBOARD_ENABLED } from "@/src/lib/constants/featureFlags";
import { useAuth } from "../context/AuthContext";
import { NavigationItem } from "./NavigationItem";

interface NavigationProps {
  accentColor?: string;
}

export function Navigation({ accentColor }: NavigationProps) {
  const { me, supabaseUser } = useAuth();

  // Prefer the Django Player username; fall back to the username captured in
  // Supabase user_metadata at registration so we never route to `/u/undefined`
  // during the brief window before `me` resolves.
  const username = me?.username ?? supabaseUser?.user_metadata?.username;

  const leaderboardNavItem = {
    label: "Leaderboard",
    href: "/leaderboard/rookie",
    active: [
      "/leaderboard/rookie",
      "/leaderboard/warrior",
      "/leaderboard/protagonist",
      "/leaderboard/diplomat",
      "/leaderboard/alchemist",
      "/leaderboard/prodigy",
      "/leaderboard/goals",
    ],
    icon: "trophy",
  };

  const NAV_ITEMS = [
    { label: "Feed", href: "/", active: ["/"], icon: "home" },
    { label: "Search", href: "/search", active: ["/search"], icon: "search" },
    {
      label: "Goals",
      href: "/goals",
      active: ["/goals", "/a"],
      icon: "squares",
    },

    ...(process.env.NEXT_PUBLIC_USER_TYPE === "admin" && LEADERBOARD_ENABLED
      ? [leaderboardNavItem]
      : []),
    {
      label: "Profile",
      // Route to settings until we know the username, rather than `/u/undefined`.
      href: username ? `/u/${username}` : "/settings",
      active: ["/u"],
      icon: "user",
    },
    {
      label: "Settings",
      href: "/settings",
      active: ["/settings"],
      icon: "settings",
    },
  ];

  return (
    <nav className="px-2 py-2 flex-1">
      <div className="space-y-4">
        {NAV_ITEMS.map((item) => (
          <NavigationItem key={item.href} {...item} accentColor={accentColor} />
        ))}
      </div>
    </nav>
  );
}
