import { authedFetch } from "@/src/lib/api/authedFetch";

const SESSION_FLAG = "lifexp:timezone-synced";

/**
 * Sends the browser's detected IANA timezone to
 * POST /api/v1/onboarding/timezone/ (via the local proxy) so the backend can
 * schedule streak/notification jobs in the user's actual timezone rather
 * than server time. Fire-and-forget — errors are swallowed since this is a
 * background sync, not a user-facing action.
 *
 * Runs at most once per browser tab session (sessionStorage-gated) since the
 * timezone can't change mid-session without a reload picking it up fresh.
 */
export function syncTimezoneInBackground(): void {
  if (typeof window === "undefined") return;
  if (window.sessionStorage.getItem(SESSION_FLAG)) return;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!timezone) return;

  window.sessionStorage.setItem(SESSION_FLAG, "1");

  authedFetch("/api/onboarding/timezone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timezone }),
  }).catch((err) => {
    console.error("Failed to sync timezone:", err);
    window.sessionStorage.removeItem(SESSION_FLAG);
  });
}
