# Convex + Django Integration Architecture

## Overview

This app uses **Convex as the single source of truth for sessions** (both live and completed) and **Django for goal metadata and lightweight session lookups**.

## Architecture

### Convex (Session Source of Truth)
- **ALL sessions** - live, paused, and completed
- Real-time updates for active sessions via WebSocket subscriptions
- Full session data:
  - XP breakdown by aspect (physique, energy, logic, creativity, social)
  - Pause intervals with timestamps
  - Duration tracking (total + focused)
  - Activity metadata (name, emoji, type)
  - Device context
  - Completion pictures/reflection images

### Django (Goals + Minimal Session Metadata)
- **Goals**: title, description, status, category, finish_by date
- **Lightweight session metadata** for mobile quick queries:
  - `session_id` (Convex ID)
  - `user_id`
  - `goal_id`
  - `activity_id`
  - `total_xp` (for sorting/filtering)
  - `interaction_count` (likes + nudges)
  - `aspect_type` (physique/energy/etc)
  - `started_at`, `ended_at` (for sorting)
  - `status` ("active", "paused", "completed")

## Data Flow

### 1. Starting a Session
```
Frontend → Convex startSession mutation
         → Django POST /api/sessions (lightweight metadata only)
```

### 2. Live Session (Heartbeats)
```
Frontend → Convex heartbeat mutation (every 5s)
         → Real-time XP/duration updates
         → No Django sync during live session
```

### 3. Completing a Session
```
Frontend → Convex completeSession mutation
         → Returns final stats
         → Django PUT /api/sessions/{id} (sync final metadata)
         → Convex markSyncedToDjango mutation
```

### 4. Displaying Sessions
```
Goal Page → useConvexSessionsByGoal(goalId)
          → Real-time Convex subscription
          → Transform to Django Session interface
          → Automatic updates when sessions change
```

## Frontend Integration

### Hooks

#### `useGoal(goalId)`
- Fetches goal from Django
- Fetches sessions from Convex (real-time)
- Returns unified interface

#### `useConvexSessionsByGoal(goalId)`
- Direct Convex subscription
- Returns array of sessions
- Auto-updates on any change

#### `useConvexActiveSession(userId)`
- Checks for active/paused session
- Prevents multiple simultaneous sessions
- Returns null if no active session

### Components Updated

1. **Goal Detail Page** (`/goals/[goalId]`)
   - ✅ Uses Convex for real-time sessions
   - ✅ Shows live XP/duration updates
   - ✅ Session list auto-updates

2. **Session Timer Page** (`/goals/[goalId]/session/[sessionId]`)
   - ✅ Uses Convex for live tracking
   - ✅ Heartbeat every 5s
   - ✅ Pause/resume functionality
   - ✅ Syncs to Django on completion

3. **Goals List Page** (`/goals`)
   - ⚠️ Still uses Django API
   - Could be enhanced with Convex for real-time active session badges

## Django API Requirements

### Session Model (Lightweight)

```python
class SessionMetadata(models.Model):
    """Lightweight session metadata for mobile quick queries"""
    session_id = models.CharField(max_length=255, unique=True)  # Convex ID
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE)
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE)

    # Quick lookup fields
    total_xp = models.IntegerField(default=0)
    interaction_count = models.IntegerField(default=0)  # likes + nudges
    aspect_type = models.CharField(max_length=20)  # dominant aspect

    # Timestamps for sorting
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('paused', 'Paused'),
            ('completed', 'Completed'),
        ]
    )

    # Sync tracking
    synced_from_convex = models.BooleanField(default=False)
    last_synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['goal', '-started_at']),
            models.Index(fields=['-total_xp']),
        ]
```

### Required Endpoints

#### POST `/api/v1/sessions/`
Register new session (fire-and-forget from frontend)
```json
{
  "session_id": "convex_id_here",
  "user_id": 123,
  "goal": 456,
  "activity": 789,
  "status": "active",
  "started_at": "2024-03-25T10:00:00Z",
  "device_platform": "web"
}
```

#### PUT `/api/v1/sessions/{session_id}`
Sync completed session metadata
```json
{
  "status": "completed",
  "ended_at": "2024-03-25T11:30:00Z",
  "total_xp": 1250,
  "completed_reason": "manual",
  "device_platform": "web"
}
```

#### GET `/api/v1/sessions/?user_id=123&limit=20`
Quick session list for mobile (optional - web uses Convex)
```json
{
  "count": 150,
  "next": "...",
  "results": [
    {
      "session_id": "convex_id",
      "goal": {...},
      "activity": {...},
      "total_xp": 1250,
      "started_at": "...",
      "ended_at": "...",
      "status": "completed"
    }
  ]
}
```

## Benefits

1. **Real-time UX**: Goal pages update instantly as sessions progress
2. **Scalability**: Convex handles WebSocket connections, Django focuses on business logic
3. **Mobile Performance**: Quick Django queries for lists, Convex for details
4. **Data Consistency**: Convex is source of truth, Django has denormalized cache
5. **Offline Support**: Session can continue in Convex even if Django sync fails

## Migration Notes

- Existing sessions in Django can remain as-is
- New sessions flow through Convex first
- No breaking changes to existing Django endpoints
- Frontend gradually migrates to Convex queries

## Future Enhancements

1. **Activity Table in Convex**: Denormalize activities for faster queries
2. **Real-time Leaderboards**: Use Convex for live XP rankings
3. **Session Collaboration**: Multiple users can "nudge" active sessions
4. **Offline Mode**: Queue mutations when offline, sync on reconnect
