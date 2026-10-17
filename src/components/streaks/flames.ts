// Flame tiers keep their own color regardless of mastery theme, so evolving
// the flame always reads as a visible reward. Everything around the flame
// (bars, buttons, borders) follows the mastery accent instead.
export const FLAME_COLORS: Record<string, string> = {
  Spark: "#f59e0b",
  Kindled: "#f97316",
  Blaze: "#ef4444",
  Inferno: "#8b5cf6",
};

export function flameColor(name: string | undefined) {
  return (name && FLAME_COLORS[name]) || FLAME_COLORS.Spark;
}

// Same cyan the habits page uses for frozen habits.
export const FREEZE_COLOR = "#06b6d4";
