import type { CSSProperties } from "react";
import { FlameIcon, FlameName } from "@/src/components/streaks/FlameIcon";
import { flameColor, flameForDays } from "@/src/components/streaks/flames";

// Soft background for a streak tile: the flame's own color at low opacity
// while the streak is alive, nothing when it isn't.
export function streakTileStyle(count: number, active: boolean): CSSProperties | undefined {
  if (!active) return undefined;
  return {
    backgroundColor: `color-mix(in srgb, ${flameColor(flameForDays(count))} 12%, transparent)`,
  };
}

// The streak page's flame (tier icon + color) followed by the day count --
// grey when the streak isn't active.
export default function StreakCount({
  count,
  active,
  iconClassName = "h-6 w-6",
  className = "",
}: {
  count: number;
  active: boolean;
  iconClassName?: string;
  className?: string;
}) {
  const flame = flameForDays(count);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <FlameIcon name={flame} muted={!active} className={`shrink-0 ${iconClassName}`} />
      {active ? (
        <FlameName name={flame}>{count}</FlameName>
      ) : (
        <span className="text-gray-400 dark:text-[var(--muted)]">{count}</span>
      )}
    </span>
  );
}
