import { LEADERBOARD_ENABLED } from "@/src/lib/constants/featureFlags";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default function LeaderboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!LEADERBOARD_ENABLED) {
    redirect("/");
  }

  return <>{children}</>;
}