"use client";

import { NavigationItem } from "./NavigationItem";

const NAV_ITEMS = [
  { label: "Feed", href: "/", icon: "home" },
  { label: "Search", href: "/search", icon: "search" },
  { label: "New Post", href: "/posts/new", icon: "plus" },
  { label: "Leaderboard", href: "/leaderboard", icon: "trophy" },
  { label: "Profile", href: "/profile", icon: "user" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

export function Navigation() {
  return (
    <nav className="px-3 py-3 flex-1">
      <div className="space-y-4">
        {NAV_ITEMS.map((item) => (
          <NavigationItem key={item.href} {...item} />
        ))}
      </div>
    </nav>
  );
}
