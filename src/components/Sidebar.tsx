"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authedFetch } from "@/src/lib/api/authedFetch";
import { useMasteryAccent } from "@/src/lib/hooks/useMasteryAccent";
import { BottomNav } from "./BottomNav";
import { TabletSideNav } from "./TabletSideNav";

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
      const res = await authedFetch(`/api/users/profile/${viewedUsername}`, {
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
      {/* >=768px: floating pill side nav, matching the Flutter app's
          tablet-landscape design (icon-only, vertically centered, accented
          by the user's own mastery color). Mobile gets BottomNav instead of
          a hamburger-triggered drawer. */}
      <TabletSideNav accentColor={accent.primary} />

      <BottomNav />
    </>
  );
}
