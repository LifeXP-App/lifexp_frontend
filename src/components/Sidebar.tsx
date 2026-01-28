"use client";

import { Navigation } from "./Navigation";
import { SidebarHeader } from "./SidebarHeader";
import { ThemeToggle } from "./ThemeToggle";
import { mockUser } from "../lib/mock/userData";
import getAccentColors from "./UserAccent";

export function Sidebar() {
  const user = mockUser;
  const accent = getAccentColors(user.masteryTitle);

  return (
    <aside className="w-64 px-4 py-2 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-2 flex flex-col h-screen">
      <SidebarHeader />
      <Navigation accentColor={accent.primary} />
      <div className="mt-auto p-6 align-middle border-t border-gray-200 dark:border-gray-800 flex justify-end">
        <ThemeToggle />
      </div>
    </aside>
  );
}
