"use client";

import { NavigationItem } from "./NavigationItem";

const NAV_ITEMS = [
  { label: "Feed", href: "/", icon: "Home" },
  { label: "Search", href: "/search", icon: "Search" },
  { label: "New Post", href: "/posts/new", icon: "Plus" },
  { label: "Leaderboard", href: "/leaderboard", icon: "Trophy" },
  { label: "Profile", href: "/profile", icon: "User" },
  { label: "Settings", href: "/settings", icon: "Settings" },
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
