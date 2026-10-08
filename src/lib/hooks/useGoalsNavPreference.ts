// Remembers whether the user last visited /goals or /habits, so the
// sidebar/bottom nav's single "Goals" slot can link back to whichever one
// they used last. Per-browser convenience only — never synced to the
// backend, same reasoning as other localStorage UI prefs in this app (e.g.
// PickTimerModePopup's remembered clock type).
export const GOALS_NAV_PREFERENCE_KEY = "goalsNavPreference";

export type GoalsNavPreference = "goals" | "habits";

export function getGoalsNavPreference(): GoalsNavPreference {
  try {
    const stored = localStorage.getItem(GOALS_NAV_PREFERENCE_KEY);
    return stored === "habits" ? "habits" : "goals";
  } catch {
    return "goals";
  }
}

export function setGoalsNavPreference(value: GoalsNavPreference) {
  try {
    localStorage.setItem(GOALS_NAV_PREFERENCE_KEY, value);
  } catch {
    // ignore (private browsing / storage disabled)
  }
}
