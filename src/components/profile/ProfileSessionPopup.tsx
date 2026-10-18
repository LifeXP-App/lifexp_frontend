"use client";

import SessionInfoPopup from "@/src/components/goals/SessionInfoPopup";
import type { ProfileSession } from "@/src/components/profile/SessionTimeline";

function formatSessionDuration(seconds?: number | null) {
  if (!seconds) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatSessionDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Read-only session details for someone's profile — maps a profile/gallery
// session payload onto SessionInfoPopup's props so the profile and the
// full sessions page show identical popups.
export default function ProfileSessionPopup({
  session,
  isOpen,
  onClose,
}: {
  session: ProfileSession | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <SessionInfoPopup
      isOpen={isOpen}
      onClose={onClose}
      sessionNumber={session?.session_number ?? 0}
      dateText={session ? formatSessionDate(session.started_at) : ""}
      totalDuration={session ? formatSessionDuration(session.total_duration_seconds) : ""}
      coverImageUrl={session?.completion_picture || undefined}
      xpDistribution={{
        physique: session?.xp_physique || 0,
        energy: session?.xp_energy || 0,
        logic: session?.xp_logic || 0,
        creativity: session?.xp_creativity || 0,
        social: session?.xp_social || 0,
      }}
      focusedDuration={session ? formatSessionDuration(session.focused_duration_seconds) : "--"}
      nudgeCount={0}
      nudgeAvatars={[]}
      activity={{
        uid: session?.activity?.uid,
        name: session?.activity?.name ?? "Activity",
        emoji: session?.activity?.emoji ?? "🎯",
        color: `var(--aspect-${session?.activity?.type || "muted"})`,
      }}
    />
  );
}
