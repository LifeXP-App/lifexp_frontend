"use client";

import { mockUser } from "../lib/mock/userData";
import { BottomNav } from "./BottomNav";
import { Navigation } from "./Navigation";
import { SidebarHeader } from "./SidebarHeader";
import getAccentColors from "./UserAccent";

export function Sidebar() {
  const user = mockUser;
  const accent = getAccentColors(user.masteryTitle);

  return (
    <>
      {/* Desktop sidebar — unchanged. Mobile now gets BottomNav instead of a
          hamburger-triggered drawer (no header bar, no logo/heading, no
          hamburger icon on any page). */}
      <aside
        aria-label="Main navigation"
        className="hidden md:static md:z-auto md:visible md:flex md:h-[100dvh] md:w-64 md:shrink-0 md:translate-x-0 md:flex-col md:border-r md:border-gray-200 md:bg-white md:px-4 md:py-2 md:shadow-none dark:md:border-[var(--border)] dark:md:bg-dark-2"
      >
        <SidebarHeader />
        <Navigation accentColor={accent.primary} />
      </aside>

      <BottomNav />
    </>
  );
}
