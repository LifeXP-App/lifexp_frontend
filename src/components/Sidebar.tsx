"use client";

import { Navigation } from "./Navigation";
import { SidebarHeader } from "./SidebarHeader";
import { ThemeToggle } from "./ThemeToggle";

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] flex flex-col h-screen">
      <SidebarHeader />
      <Navigation />
      <div className="mt-auto p-6 border-t border-gray-200 dark:border-gray-800">
        <ThemeToggle />
      </div>
    </aside>
  );
}
