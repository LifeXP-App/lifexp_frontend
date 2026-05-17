# Leaderboard Temporary Disable

Date: 2026-05-17

## Why this exists

The leaderboard UI is being hidden temporarily without deleting the current implementation. The goal is to keep the existing work in place so it can be restored quickly later.

## What changed

1. Added a temporary feature flag in `src/lib/constants/featureFlags.ts`.
2. Updated `src/components/Navigation.tsx` so the sidebar leaderboard item only renders when that flag is enabled.
3. Added `app/(main)/leaderboard/layout.tsx` to redirect every `/leaderboard/*` page to `/` while the flag is disabled.

## What was intentionally left alone

- The existing leaderboard pages were not deleted.
- The existing leaderboard components were not deleted.
- The existing leaderboard API routes were not removed.

## How to re-enable it later

1. Open `src/lib/constants/featureFlags.ts`.
2. Change `LEADERBOARD_ENABLED` from `false` to `true`.
3. Verify the sidebar link appears again for admin users.
4. Verify direct visits to `/leaderboard/rookie`, `/leaderboard/goals`, and `/leaderboard/goals/[goalId]` render correctly again.

## Notes

- Browser history or autocomplete may still suggest old leaderboard URLs on a user's machine, but those routes now redirect away and no longer expose leaderboard content.
- This approach keeps the leaderboard code path recoverable without needing to reconstruct deleted files.
