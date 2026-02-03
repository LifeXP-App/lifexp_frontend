"use client";

import { NavigationItem } from "./NavigationItem";
import { useAuth } from "../context/AuthContext";


interface NavigationProps {
  accentColor?: string;
}

export function Navigation({ accentColor }: NavigationProps) {

const { me, loading, logout } = useAuth();
console.log(me)

const NAV_ITEMS = [
  { label: "Feed", href: "/", active: ["/"], icon: "home" },
  { label: "Search", href: "/search", active: ["/search"], icon: "search" },
  { label: "Goals", href: "/goals", active: ["/goals"], icon: "squares" },
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
      "/leaderboard/goals",
    ],
    icon: "trophy",
  },
  { label: "Profile", href: `/u/${me?.username}`, active: ["/u"], icon: "user" },
  { label: "Settings", href: "/settings", active: ["/settings"], icon: "settings" },
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
