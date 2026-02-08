import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Abandon stale sessions that missed heartbeats
crons.interval(
  "cleanup stale sessions",
  { minutes: 2 },
  internal.sessionJobs.cleanupStaleSessions
);

// Retry Django sync for completed sessions that failed to sync
crons.interval(
  "retry django sync",
  { minutes: 5 },
  internal.sessionJobs.retryDjangoSync
);

export default crons;
