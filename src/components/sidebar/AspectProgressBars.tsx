"use client";

import { UserProfile } from "../../lib/types";
import { AspectProgressBar } from "../AspectProgressBar";

interface AspectProgressBarsProps {
  user: UserProfile;
}

const ASPECT_ORDER = [
  "physique",
  "energy",
  "logic",
  "creativity",
  "social",
] as const;

export function AspectProgressBars({ user }: AspectProgressBarsProps) {
  return (
    <div
      className="px-6 py-4 border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Life Aspects
      </h4>
      <div className="space-y-3">
        {ASPECT_ORDER.map((aspectId) => (
          <AspectProgressBar key={aspectId} aspect={user.aspects[aspectId]} />
        ))}
      </div>
    </div>
  );
}
