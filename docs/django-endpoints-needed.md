# Django Endpoints Needed for Convex + Session Integration

## Existing Pattern

All Next.js API routes proxy to Django using:
- Base URL: `NEXT_PUBLIC_API_BASE_URL` (currently `http://127.0.0.1:8000`)
- Auth: Bearer token from `access` cookie → `Authorization: Bearer <token>`
- Format: `${baseUrl}/api/v1/{endpoint}/`
- All responses are JSON

---

## Endpoints Needed

### 1. Calculate XP Rates (AI-powered)

**`POST /api/v1/sessions/calculate-rates/`**

Called before creating a Convex session. Returns per-second XP rates for each dimension based on the activity.

**Request:**
```json
{
  "activity_id": "<uuid>",
  "goal_id": "<uuid>"
}
```

**Response:**
```json
{
  "rates": {
    "physique": 0.5,
    "energy": 0.3,
    "logic": 0.2,
    "creativity": 0.8,
    "social": 0.1
  }
}
```

**Notes:**
- This is the AI rate calculation engine — rates determine how much XP per second the user earns in each dimension
- Rates depend on the activity type (e.g., "Drawing" → high creativity, low physique)
- Used by the session page before calling Convex `startSession`

---

### 2. Register Session (Convex → Django sync on start)

**`POST /api/v1/sessions/`**

Called after Convex creates the session. Registers the session in Django's permanent store.

**Request:**
```json
{
  "session_id": "<convex_id>",
  "user_id": "<django_user_id>",
  "goal_id": "<uuid>",
  "activity_id": "<uuid>",
  "status": "active",
  "started_at": "2025-01-15T10:30:00Z",
  "device_platform": "web"
}
```

**Response:**
```json
{
  "id": "<convex_id>",
  "status": "active"
}
```

**Notes:**
- `session_id` is the Convex `_id` — Django uses this as its primary key
- Fire-and-forget from Convex's perspective; if it fails, the sync retry cron will handle it
- Django should upsert (create or ignore if already exists)

---

### 3. Complete Session (Convex → Django sync on end)

**`PUT /api/v1/sessions/<session_id>/`**

Called when a session completes in Convex. Updates Django with final totals.

**Request:**
```json
{
  "status": "completed",
  "ended_at": "2025-01-15T12:00:00Z",
  "total_duration_seconds": 3600,
  "focused_duration_seconds": 3200,
  "xp_total": 28000,
  "xp_physique": 16000,
  "xp_energy": 3200,
  "xp_logic": 0,
  "xp_creativity": 8000,
  "xp_social": 800,
  "completed_reason": "manual",
  "device_platform": "web"
}
```

**Response:**
```json
{
  "id": "<convex_id>",
  "status": "completed",
  "xp_total": 28000
}
```

**Notes:**
- `completed_reason` is one of: `manual`, `auto`, `abandoned`, `timeout`, `crash_recovered`
- Django should update the user's XP ledger / Life Level on receiving this
- If session doesn't exist in Django yet (start sync failed), Django should create it

---

### 4. Get Goal Detail

**`GET /api/v1/goals/<goal_id>/`**

The session page needs goal metadata (title, emoji, category, color) to display during a live session.

**Response:**
```json
{
  "id": "<uuid>",
  "title": "Drawing Mandalorian",
  "emoji": "🎨",
  "category": {
    "name": "Drawing",
    "color": "#4187a2"
  },
  "user": "<uuid>",
  "status": "active",
  "days_total": 30,
  "days_completed": 12
}
```

**Notes:**
- This likely already exists — just confirming the session page needs it
- Needed fields: `title`, `emoji`, `category.name`, `category.color`

---

### 5. Get Activity Detail

**`GET /api/v1/activities/<activity_id>/`**

Needed to show activity info on the session page and to pass to the rate calculation endpoint.

**Response:**
```json
{
  "id": "<uuid>",
  "name": "Drawing",
  "emoji": "🎨",
  "category": "Creativity",
  "color": "#4187a2"
}
```

---

### 6. Get Session History (per goal)

**`GET /api/v1/goals/<goal_id>/sessions/`**

Used by the goal detail page and reflection page to show past sessions.

**Response:**
```json
{
  "results": [
    {
      "id": "<convex_id>",
      "started_at": "2025-01-15T10:30:00Z",
      "ended_at": "2025-01-15T12:00:00Z",
      "total_duration_seconds": 3600,
      "focused_duration_seconds": 3200,
      "xp_total": 28000,
      "xp_physique": 16000,
      "xp_energy": 3200,
      "xp_logic": 0,
      "xp_creativity": 8000,
      "xp_social": 800,
      "completed_reason": "manual",
      "activity": {
        "id": "<uuid>",
        "name": "Drawing",
        "emoji": "🎨"
      }
    }
  ]
}
```

---

## Summary Table

| # | Method | Endpoint | Called By | Priority |
|---|--------|----------|-----------|----------|
| 1 | POST | `/api/v1/sessions/calculate-rates/` | Session page (before Convex start) | **HIGH** — blocks session start |
| 2 | POST | `/api/v1/sessions/` | Convex HTTP action (on session start) | HIGH — but async, retry-safe |
| 3 | PUT | `/api/v1/sessions/<id>/` | Convex HTTP action (on session complete) | HIGH — but async, retry-safe |
| 4 | GET | `/api/v1/goals/<id>/` | Session page (for display) | MEDIUM — may already exist |
| 5 | GET | `/api/v1/activities/<id>/` | Session page (for display) | MEDIUM — may already exist |
| 6 | GET | `/api/v1/goals/<id>/sessions/` | Goal detail + reflection pages | MEDIUM — may already exist |

---

## Django Session Model (for reference)

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
