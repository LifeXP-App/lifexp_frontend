// Flame tiers keep their own color regardless of mastery theme, so evolving
// the flame always reads as a visible reward. Everything around the flame
// (bars, buttons, borders) follows the mastery accent instead.
export const FLAME_COLORS: Record<string, string> = {
  Spark: "#f59e0b",
  Kindled: "#f97316",
  Blaze: "#ef4444",
  // Solid stand-in for small marks; big flames use INFERNO_STOPS instead.
  Inferno: "#ec4899",
};

export function flameColor(name: string | undefined) {
  return (name && FLAME_COLORS[name]) || FLAME_COLORS.Spark;
}

// Tier a streak of `days` reaches (mirrors FLAME_LEVELS in the backend).
export function flameForDays(days: number) {
  return days >= 100 ? "Inferno" : days >= 30 ? "Blaze" : days >= 7 ? "Kindled" : "Spark";
}

// "White-hot" top tier, bottom to top. No aspect/mastery color uses pink, so
// Inferno never reads as Logic/Prodigy purple.
export const INFERNO_STOPS = ["#fbbf24", "#f97316", "#ec4899"] as const;
export const INFERNO_TEXT_GRADIENT = `linear-gradient(90deg, ${INFERNO_STOPS.join(", ")})`;

// Same cyan the habits page uses for frozen habits.
export const FREEZE_COLOR = "#06b6d4";
