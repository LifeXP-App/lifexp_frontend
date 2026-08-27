import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Abandon stale sessions that missed heartbeats
crons.interval(
  "cleanup stale sessions",
  { minutes: 2 },
  internal.sessionJobs.cleanupStaleSessions
);

// NOTE: there used to be a "retry django sync" cron here running every 5
// minutes forever. Its handler (sessionJobs.retryDjangoSync) was a stub that
// only console.log'd -- it never actually synced anything, so it spent
// months burning a Convex function call every 5 minutes for zero benefit.
// Removed. Django sync retries now happen client-side, bounded, at the
// moment the actual sync HTTP call is made (see syncSessionToDjango in
// app/(fullscreen)/goals/[goalId]/session/[sessionId]/page.tsx and
// launchSession/syncSessionToDjango-equivalent in lifexp_flutter's
// session_timer_screen.dart) -- never re-invoke a Convex mutation on a
// timer/cron for this again.

export default crons;
