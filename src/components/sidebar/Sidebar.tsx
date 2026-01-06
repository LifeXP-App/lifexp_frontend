"use client";

import { Loader2 } from "lucide-react";
import { useUser } from "../../lib/hooks/useUser";
import { AspectProgressBars } from "../AspectProgressBars";
import { Navigation } from "../Navigation";
import { SidebarHeader } from "../SidebarHeader";
import { ThemeToggle } from "../ThemeToggle";
import { UserProfile } from "../UserProfile";

export function Sidebar() {
  const { user, loading } = useUser();

  if (loading || !user) {
    return (
      <aside
        className="w-80 border-r flex items-center justify-center h-screen"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "var(--warrior-primary)" }}
        />
      </aside>
    );
  }

  return (
    <aside
      className="w-80 border-r flex flex-col h-screen"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <SidebarHeader />
      <UserProfile user={user} />
      <AspectProgressBars user={user} />
      <Navigation />

      <div
        className="px-6 py-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Theme
          </span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
