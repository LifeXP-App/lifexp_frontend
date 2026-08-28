"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMasteryAccent } from "@/src/lib/hooks/useMasteryAccent";
import { BottomNav } from "./BottomNav";
import { Navigation } from "./Navigation";
import { SidebarHeader } from "./SidebarHeader";

// On someone's profile page, the active "Profile" sidebar item themes by
// THAT profile's mastery, not the logged-in viewer's own — everywhere else
// (including your own profile, /u/edit) it's the viewer's own mastery.
function useViewedProfileUsername(): string | null {
  const pathname = usePathname();
  const match = pathname?.match(/^\/u\/([^/]+)\/?$/);
  const username = match?.[1];
  return username && username !== "edit" ? username : null;
}

export function Sidebar() {
  const viewedUsername = useViewedProfileUsername();

  const { data: viewedProfile } = useQuery({
    queryKey: ["sidebar-viewed-mastery", viewedUsername],
    queryFn: async () => {
      const res = await fetch(`/api/users/profile/${viewedUsername}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return (await res.json()) as { masteryTitle?: string };
    },
    enabled: !!viewedUsername,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const accent = useMasteryAccent(
    viewedUsername ? viewedProfile?.masteryTitle : undefined,
  );

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
