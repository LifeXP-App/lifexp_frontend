import type { StrengthTier } from "@/src/components/habits/StrengthInfoPopup";

const FILLED: Record<StrengthTier, number> = {
  dormant: 0,
  light: 1,
  steady: 2,
  strong: 3,
};

const LABEL: Record<StrengthTier, string> = {
  dormant: "Dormant",
  light: "Weak",
  steady: "Steady",
  strong: "Strong",
};

const BARS = [
  { height: 16, y: 39 },
  { height: 30, y: 25 },
  { height: 45, y: 10 },
];

// Compact 3-bar strength meter (same geometry as the habits page's meter),
// for places that only need to show the tier.
export default function StrengthBars({
  tier,
  color,
  size = 28,
}: {
  tier: StrengthTier;
  color: string;
  size?: number;
}) {
  const filled = FILLED[tier];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 62"
      role="img"
      aria-label={`Habit strength: ${LABEL[tier]}`}
      className="shrink-0"
    >
      <title>{LABEL[tier]}</title>
      {BARS.map((bar, index) => (
        <rect
          key={index}
          x={3 + index * 16}
          y={bar.y}
          width="10"
          height={bar.height}
          rx="2.5"
          fill={index < filled ? color : "transparent"}
          stroke="#6b7280"
          strokeOpacity={index < filled ? 0 : 0.5}
          strokeWidth={index < filled ? 0 : 1.5}
        />
      ))}
    </svg>
  );
}
