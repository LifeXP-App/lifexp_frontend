# LifeXP — Convex Real-Time Session System Spec

## Product Context

LifeXP is a gamified personal growth platform. Users set goals, pick activities, and run timed sessions to earn XP across five dimensions of human development. Think of it as an RPG leveling system for real life.

The five XP dimensions are:
- **Physique** — strength, movement, physical resilience
- **Energy** — focus, emotional stability, mental stamina
- **Logic** — learning, strategy, cognitive challenge
- **Creativity** — creation, experimentation, problem solving
- **Social** — communication, empathy, collaboration

XP accumulates to increase a user's Life Level. When a user's strongest dimension crosses major thresholds, they earn a Mastery Title (Warrior, Protagonist, Prodigy, Alchemist, Diplomat).

---

## Architecture Overview

LifeXP has a split backend architecture:

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Real-time engine** | Convex | Live session state, heartbeats, pause tracking, real-time XP ticking, real-time UI subscriptions |
| **REST API / permanent store** | Django (Python) | Users, goals, activities, achievements, session history, AI XP rate calculation, long-term XP ledger, profile/level management |
| **Mobile app** | Flutter | Primary client. Uses Convex subscriptions for live session screen, Django REST for everything else |

### Data Flow

```
[Flutter App]
     │
     ├── GET/POST ──► [Django REST API] ◄── source of truth for users, goals, activities, achievements
     │
     └── subscribe/mutate ──► [Convex] ◄── source of truth for LIVE session state only
                                  │
                                  └── POST (on start) / PUT (on complete) ──► [Django REST API]
```

### Session Lifecycle

1. User selects an activity in Flutter
2. Flutter calls Django endpoint to get AI-calculated XP rates for that activity (per-second rates per dimension)
3. Flutter creates a session in Convex with those rates → Convex is now the live authority
4. Convex fires an async POST to Django to register the session (Django stores session ID + basic metadata with status "active")
5. During the session: all state changes (heartbeats, pauses, resumes, XP ticking) happen exclusively in Convex. Flutter subscribes to the Convex session doc for live UI updates
6. Session completes → Convex mutation finalizes all totals → Convex fires a PUT to Django with the completed payload (durations, XP breakdown, completion reason)
7. Post-session: Flutter uses Django REST for session history, profile stats, achievements. Convex data is retained but Django is the long-term store

### Key Principle: Convex Generates the Session ID

Convex creates the session document first and generates the `_id`. This ID is then sent to Django. This ordering is critical because the Convex doc must exist before Django can reference it, and we don't want Django latency blocking the session start UX.

---

## Convex Schema

### Session Table

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const xpRates = v.object({
  physique: v.number(),
  energy: v.number(),
  logic: v.number(),
  creativity: v.number(),
  social: v.number(),
});

export default defineSchema({
  sessions: defineTable({
    // ── Ownership ──
    userId: v.string(),       // Django user UUID
    goalId: v.string(),       // Django goal UUID
    activityId: v.string(),   // primary activity UUID (denormalized from rateSegments[0])

    // ── Lifecycle ──
    status: v.union(
      v.literal("live"),
      v.literal("paused"),
      v.literal("completed")
    ),
    startedAt: v.number(),              // epoch ms
    endedAt: v.optional(v.number()),    // set on completion
    lastResumedAt: v.optional(v.number()), // last time session went from paused → live

    // ── Heartbeat ──
    lastHeartbeatAt: v.number(),        // epoch ms, updated periodically by client

    // ── Pause Tracking ──
    // Array of pause intervals. The LAST entry may have resumedAt: undefined,
    // meaning the session is currently paused. On resume, patch that last entry
    // with the resumedAt timestamp. On completion while paused, patch it with endedAt.
    pauseIntervals: v.array(
      v.object({
        pausedAt: v.number(),
        resumedAt: v.optional(v.number()),
        reason: v.optional(v.string()),   // "user_initiated", "app_backgrounded", "break"
      })
    ),

    // ── Time Tracking (authoritative totals) ──
    totalDurationSeconds: v.number(),     // wall-clock since startedAt
    focusedDurationSeconds: v.number(),   // active time only (total minus pause time)
    // NOTE: break/pause duration is DERIVED by summing pauseIntervals.
    // Do NOT store it separately to avoid drift.

    // ── XP Rates ──
    // Array of rate segments. V1: always a single entry.
    // Future: multiple entries when user switches activities mid-session.
    // atSecond = the focusedDurationSeconds value when this segment's rates kicked in.
    // XP calculation: iterate segments, multiply each segment's rates by its duration portion.
    // Duration of segment i = rateSegments[i+1].atSecond - rateSegments[i].atSecond
    // (last segment runs until current focusedDurationSeconds)
    rateSegments: v.array(
      v.object({
        atSecond: v.number(),       // 0 for the first segment
        activityId: v.string(),     // which activity these rates belong to
        rates: xpRates,             // XP per second per dimension
      })
    ),

    // ── XP Totals (live-updated) ──
    xpTotal: v.number(),
    xpBreakdown: xpRates,   // per-dimension totals

    // ── Social ──
    nudgeCount: v.number(),  // cached counter of nudges received during session

    // ── Device Context ──
    deviceContext: v.optional(
      v.object({
        platform: v.union(
          v.literal("ios"),
          v.literal("android"),
          v.literal("web")
        ),
        appVersion: v.optional(v.string()),
        timezone: v.optional(v.string()),
        locale: v.optional(v.string()),
      })
    ),

    // ── Completion Metadata ──
    completedReason: v.optional(
      v.union(
        v.literal("manual"),           // user tapped "end session"
        v.literal("auto"),             // goal completion triggered it
        v.literal("abandoned"),        // heartbeat cron killed it
        v.literal("timeout"),          // max session duration reached
        v.literal("crash_recovered")   // client reconnected and patched a stale session
      )
    ),
    interruptionReason: v.optional(v.string()), // freeform: "app_backgrounded", "crash", etc.

    // ── Django Sync ──
    syncedToDjango: v.boolean(),           // has completion payload been sent to Django?
    lastSyncedAt: v.optional(v.number()),  // epoch ms of last successful sync
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_goal", ["goalId"])
    .index("by_sync", ["syncedToDjango"])
    .index("by_heartbeat", ["status", "lastHeartbeatAt"]),
});
```

---

## Mutations to Implement

All mutations should be in `convex/sessions.ts`. Each mutation operates on the session state machine and must enforce valid state transitions.

### State Machine

```
[start] ──► LIVE ◄──► PAUSED
               │          │
               ▼          ▼
           COMPLETED ◄────┘
```

Valid transitions:
- `startSession` → creates doc with status `live`
- `pauseSession` → `live` → `paused`
- `resumeSession` → `paused` → `live`
- `completeSession` → `live` OR `paused` → `completed`
- `abandonSession` → `live` OR `paused` → `completed` (with reason `abandoned`)

Invalid transitions should throw errors.

### 1. `startSession`

**Args:** `userId`, `goalId`, `activityId`, `rates` (xpRates object), `deviceContext` (optional)

**Logic:**
- Check no existing `live` or `paused` session for this user (query `by_user_status` index). Throw if one exists.
- Create session doc with:
  - `status: "live"`
  - `startedAt: Date.now()`
  - `lastHeartbeatAt: Date.now()`
  - `pauseIntervals: []`
  - `totalDurationSeconds: 0`
  - `focusedDurationSeconds: 0`
  - `rateSegments: [{ atSecond: 0, activityId, rates }]`
  - `xpTotal: 0`, `xpBreakdown: { physique: 0, energy: 0, logic: 0, creativity: 0, social: 0 }`
  - `nudgeCount: 0`
  - `syncedToDjango: false`
- Return the created session `_id` (this becomes the canonical session ID sent to Django)

**Post-mutation:** Client should fire an async HTTP POST to Django to register the session. This can be a Convex HTTP action or client-side — decide based on reliability needs.

### 2. `heartbeat`

**Args:** `sessionId`

**Logic:**
- Fetch session, verify status is `live`
- Calculate elapsed time since `startedAt`
- Calculate total pause duration by summing completed `pauseIntervals`
- Update:
  - `lastHeartbeatAt: Date.now()`
  - `totalDurationSeconds: (now - startedAt) / 1000`
  - `focusedDurationSeconds: totalDuration - totalPauseDuration`
  - Recalculate `xpTotal` and `xpBreakdown` from `rateSegments` × `focusedDurationSeconds`

**Frequency:** Client sends every 5-10 seconds. This is the primary mechanism for updating durations and XP in real-time.

### 3. `pauseSession`

**Args:** `sessionId`, `reason` (optional string)

**Logic:**
- Fetch session, verify status is `live`
- Run a heartbeat-style time/XP update first (so totals are current)
- Append to `pauseIntervals`: `{ pausedAt: Date.now(), reason }`
  - Note: `resumedAt` is NOT set — this marks an open pause interval
- Set `status: "paused"`

### 4. `resumeSession`

**Args:** `sessionId`

**Logic:**
- Fetch session, verify status is `paused`
- Find the last entry in `pauseIntervals` — it should have `resumedAt: undefined`
- Patch that entry: set `resumedAt: Date.now()`
- Set `status: "live"`, `lastResumedAt: Date.now()`, `lastHeartbeatAt: Date.now()`

### 5. `completeSession`

**Args:** `sessionId`, `reason` (`"manual"` | `"auto"` | `"timeout"`)

**Logic:**
- Fetch session, verify status is `live` or `paused`
- If `paused`: close the open pause interval by setting `resumedAt: Date.now()` on the last entry
- Run final time/XP calculation
- Set:
  - `status: "completed"`
  - `endedAt: Date.now()`
  - `completedReason: reason`
  - Final `totalDurationSeconds`, `focusedDurationSeconds`, `xpTotal`, `xpBreakdown`

**Post-mutation:** Trigger Django sync (PUT with completed payload). Can be a scheduled Convex action.

### 6. `abandonSession`

**Args:** `sessionId`, `interruptionReason` (optional string)

**Logic:**
- Same as `completeSession` but with:
  - `completedReason: "abandoned"`
  - `interruptionReason` if provided

Used by: heartbeat cron (server-side), crash recovery (client-side).

---

## Queries to Implement

### 1. `getActiveSession`

**Args:** `userId`

**Returns:** The current `live` or `paused` session for the user, or `null`.

**Use case:** App launch — check if user has a session to resume into.

Query `by_user_status` with `status: "live"` first, then `status: "paused"` if no live session found.

### 2. `getSession`

**Args:** `sessionId`

**Returns:** Full session document.

**Use case:** Live session screen subscribes to this for real-time UI updates.

### 3. `getSessionsByGoal`

**Args:** `goalId`

**Returns:** All sessions for a goal, ordered by `startedAt` descending.

**Use case:** Goal detail screen showing session history (can be used alongside Django data).

---

## Scheduled Jobs / Crons

### Stale Session Cleanup

A Convex cron that runs every 1-2 minutes:
- Query `by_heartbeat` index for sessions with `status: "live"` and `lastHeartbeatAt < (now - STALE_THRESHOLD)`
- `STALE_THRESHOLD` should be configurable, suggested: 5 minutes
- For each stale session: call `abandonSession` with `interruptionReason: "heartbeat_timeout"`

### Django Sync Retry

A Convex cron that runs every 5 minutes:
- Query `by_sync` index for `syncedToDjango: false` and `status: "completed"`
- For each: retry the PUT to Django
- On success: set `syncedToDjango: true`, `lastSyncedAt: Date.now()`
- On failure: log and retry next cycle

---

## XP Calculation Logic

This is the core calculation used by heartbeat and completion:

```
function calculateXP(rateSegments, focusedDurationSeconds):
  breakdown = { physique: 0, energy: 0, logic: 0, creativity: 0, social: 0 }

  for each segment (index i):
    segmentStart = segment.atSecond
    segmentEnd = (next segment exists) ? nextSegment.atSecond : focusedDurationSeconds

    if segmentStart >= focusedDurationSeconds: break  // beyond current time

    effectiveEnd = min(segmentEnd, focusedDurationSeconds)
    duration = effectiveEnd - segmentStart

    for each dimension:
      breakdown[dimension] += segment.rates[dimension] * duration

  total = sum of all breakdown values (floor to integer)
  return { total, breakdown }
```

**V1:** `rateSegments` always has exactly one entry with `atSecond: 0`, so this simplifies to `dimension_xp = rate * focusedDurationSeconds` for each dimension.

**Future multi-activity:** Multiple segments, calculation iterates them. Example:
- Segment 0: atSecond=0, gym rates → applied from second 0 to 1800
- Segment 1: atSecond=1800, stretching rates → applied from second 1800 to current
- Total XP = (1800 × gym rates) + ((current - 1800) × stretching rates)

---

## Django Sync Payloads

### POST on session start (Convex → Django)

```json
{
  "session_id": "<convex _id>",
  "user_id": "<uuid>",
  "goal_id": "<uuid>",
  "activity_id": "<uuid>",
  "status": "active",
  "started_at": "<ISO datetime>",
  "device_platform": "ios"
}
```

Django endpoint: `POST /api/v1/sessions/`

### PUT on session complete (Convex → Django)

```json
{
  "session_id": "<convex _id>",
  "status": "completed",
  "ended_at": "<ISO datetime>",
  "total_duration_seconds": 3600,
  "focused_duration_seconds": 3200,
  "xp_total": 28000,
  "xp_physique": 16000,
  "xp_energy": 3200,
  "xp_logic": 0,
  "xp_creativity": 0,
  "xp_social": 3200,
  "completed_reason": "manual",
  "device_platform": "ios"
}
```

Django endpoint: `PUT /api/v1/sessions/<session_id>/`

Note: `pauseIntervals` are NOT sent to Django. They stay in Convex for analytics only.

---

## Django Session Model (for reference)

The Django side stores a thinner version of the session. This is what Flutter GETs for session history:

```python
class Session(models.Model):
    id = models.CharField(max_length=255, primary_key=True)  # Convex _id
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE)
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE)

    status = models.CharField(max_length=20)  # active, completed, abandoned
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True)

    total_duration_seconds = models.IntegerField(null=True)
    focused_duration_seconds = models.IntegerField(null=True)
    xp_total = models.IntegerField(default=0)
    xp_physique = models.IntegerField(default=0)
    xp_energy = models.IntegerField(default=0)
    xp_logic = models.IntegerField(default=0)
    xp_creativity = models.IntegerField(default=0)
    xp_social = models.IntegerField(default=0)

    completed_reason = models.CharField(max_length=20, null=True)
    device_platform = models.CharField(max_length=10, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "-started_at"]),
            models.Index(fields=["goal"]),
            models.Index(fields=["user", "status"]),
        ]
```

---

## Important Implementation Notes

1. **Convex generates the session ID.** The `_id` from `ctx.db.insert()` is the canonical session identifier across both systems. Django receives it, never generates its own.

2. **Heartbeat is the XP engine.** XP doesn't tick automatically — it's recalculated every time the client sends a heartbeat (every 5-10 seconds). The Flutter UI subscribes to the session doc and renders the latest `xpBreakdown`. No websocket XP stream needed — Convex reactivity handles it.

3. **`pauseIntervals` state rule:** If the last entry has `resumedAt: undefined`, the session is currently paused. There should NEVER be more than one open pause interval. Mutations must enforce this — `pauseSession` should reject if already paused, `resumeSession` should reject if not paused.

4. **Break duration is derived, never stored.** Calculate it by summing `(resumedAt - pausedAt)` for all completed intervals, plus `(now - pausedAt)` for any open interval. This avoids drift between stored totals.

5. **V1 simplification:** `rateSegments` always has exactly one entry. `activityId` at the top level is denormalized from `rateSegments[0].activityId` for query convenience. The multi-segment infrastructure exists in the schema but mutations don't need to handle activity switching yet.

6. **Convex HTTP actions for Django sync** are preferred over client-side sync. If the client calls Django directly, there's a risk of the app closing before the sync completes. A Convex action + retry cron is more reliable.

7. **No authentication layer is defined here.** Convex mutations currently accept `userId` as a string arg. In production, this must be replaced with proper auth (Convex supports custom JWT verification). The AI agent should add a TODO/placeholder for this.
