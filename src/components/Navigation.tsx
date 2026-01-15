"use client";

import { NavigationItem } from "./NavigationItem";

const NAV_ITEMS = [
  { label: "Feed", href: "/", active: ["/"], icon: "home" },
  { label: "Search", href: "/search", active: ["/search"], icon: "search" },
  { label: "New Post", href: "/posts/new", active: ["/posts/new"], icon: "plus" },
  {
    label: "Leaderboard",
    href: "/leaderboard/rookie",
    active: [
      "/leaderboard/rookie",
      "/leaderboard/warrior",
      "/leaderboard/protagonist",
      "/leaderboard/diplomat",
      "/leaderboard/alchemist",
      "/leaderboard/prodigy",
    ],
    icon: "trophy",
  },
  { label: "Profile", href: "/profile", active: ["/profile"], icon: "user" },
  { label: "Settings", href: "/settings", active: ["/settings"], icon: "settings" },
];


interface NavigationProps {
  accentColor?: string;
}

export function Navigation({ accentColor }: NavigationProps) {
  return (
    <nav className="px-3 py-3 flex-1">
      <div className="space-y-4">
        {NAV_ITEMS.map((item) => (
          <NavigationItem key={item.href} {...item} accentColor={accentColor} />
        ))}
      </div>
    </nav>
  );
}
