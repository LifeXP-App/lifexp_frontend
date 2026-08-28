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
 */
export function useMasteryAccent() {
  const { me } = useAuth();

  return useMemo(() => getAccentColors(me?.masteryTitle ?? "rookie"), [me?.masteryTitle]);
}
