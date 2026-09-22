import { useSyncExternalStore } from "react";

function detectApplePlatform(): boolean {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ Safari reports its platform as "MacIntel" but exposes
    // multi-touch, which a real Mac (mouse/trackpad only) does not.
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);

  return isIOS || (/Mac/.test(platform) && !isIOS);
}

// navigator.userAgent/platform never change during a session, so a plain
// cached boolean is a valid, stable client snapshot for useSyncExternalStore
// — no subscription is needed since this "store" never emits updates.
let cached: boolean | null = null;
function getSnapshot(): boolean {
  if (cached === null) cached = detectApplePlatform();
  return cached;
}
function getServerSnapshot(): boolean {
  return false;
}
function subscribe(): () => void {
  return () => {};
}

/**
 * True when running on an Apple platform (iOS, iPadOS, or macOS) — gates the
 * "Sign in with Apple" web button so it only appears where it makes sense.
 *
 * Uses useSyncExternalStore rather than a plain effect+setState so the
 * server snapshot (false, since navigator doesn't exist during SSR) and the
 * client snapshot never disagree mid-render — that's exactly the hydration
 * mismatch this hook would otherwise risk on a server-rendered page.
 * Deliberately sniffs userAgent/platform rather than the newer
 * navigator.userAgentData, since that API is Chromium-only and would
 * misdetect Safari — the primary browser for the users this targets.
 */
export function useIsApplePlatform(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
