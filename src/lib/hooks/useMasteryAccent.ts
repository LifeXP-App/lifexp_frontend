import { useMemo } from "react";
import { useAuth } from "@/src/context/AuthContext";
import getAccentColors from "@/src/components/UserAccent";

/**
 * Site-wide "Mastery Theme": once the logged-in user's mastery title is
 * anything other than Rookie, primary UI accents (buttons, active pills,
 * progress bars) switch from the default rookie blue to that title's aspect
 * color. Returns the Rookie fallback (rookie blue) whenever `me` hasn't
 * loaded yet or the title is Rookie itself, so callers can use this
 * unconditionally without a loading branch.
 *
 * Pass `overrideMasteryTitle` to theme by someone else's mastery instead of
 * the logged-in user's — e.g. the sidebar on a profile page themes by the
 * *viewed* profile's mastery, not the viewer's own.
 */
export function useMasteryAccent(overrideMasteryTitle?: string) {
  const { me } = useAuth();
  const title = overrideMasteryTitle ?? me?.masteryTitle ?? "rookie";

  return useMemo(() => getAccentColors(title), [title]);
}

/**
 * The color to use for primary buttons/pills: the user's mastery color once
 * they have a mastery title (anything other than Rookie), otherwise the
 * default rookie blue as a CSS variable reference.
 */
export function useMasteryPrimaryColor() {
  const { me } = useAuth();
  const accent = useMasteryAccent();
  const isMastery = !!me?.masteryTitle && me.masteryTitle !== "Rookie";
  return isMastery ? accent.primary : "var(--rookie-primary)";
}
