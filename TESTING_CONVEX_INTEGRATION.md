# Testing Convex Integration

## What Was Changed

### Frontend Changes

1. **New Hook: `useConvexSessions.ts`**
   - `useConvexSessionsByGoal(goalId)` - Real-time sessions for a goal
   - `useConvexActiveSession(userId)` - Check for active sessions
   - `useConvexSession(sessionId)` - Fetch specific session

2. **Updated Hook: `useGoals.ts`**
   - Now fetches goals from Django
   - Fetches sessions from Convex in real-time
   - Transforms Convex sessions to match Django interface
   - No breaking changes to components using it

3. **Enhanced Convex Schema**
   - Added `activityName`, `activityEmoji`, `activityType` to sessions
   - Added `completionPicture` field
   - Denormalized activity data for performance

4. **Enhanced Session API**
   - `/api/sessions/calculate-rates` now returns activity metadata
   - Session page passes activity metadata to Convex
   - Better UX with activity details in real-time

## Testing Checklist

### 1. Goal Detail Page (`/goals/[goalId]`)

**Real-time Session Updates:**
- [ ] Open goal page in two browser tabs
- [ ] Start a new session in tab 1
- [ ] Verify tab 2 shows the new session immediately (no refresh needed)
- [ ] Watch XP and duration update in real-time in tab 2

**Session Display:**
- [ ] Sessions show correct activity emoji and name
- [ ] XP breakdown shows all 5 aspects
- [ ] Duration displays correctly
- [ ] Session ordering is correct (newest first)

**Interactions:**
- [ ] Click on a session to see details popup
- [ ] "Start Session" button works
- [ ] "New Session" button works

### 2. Session Timer Page (`/goals/[goalId]/session/[sessionId]`)

**Starting Session:**
- [ ] Can start new session from activity selection
- [ ] Timer starts immediately
- [ ] XP counter shows 0 initially
- [ ] Prevents starting multiple sessions

**Live Tracking:**
- [ ] Timer updates every second
- [ ] XP increases based on activity rates
- [ ] Heartbeat sends every 5 seconds (check network tab)
- [ ] Page reload preserves session state

**Pause/Resume:**
- [ ] Pause button stops timer
- [ ] Pause button changes to play icon
- [ ] Resume continues from where it left off
- [ ] Paused duration doesn't count toward XP

**Completion:**
- [ ] Complete session shows final stats
- [ ] Redirects to reflection page
- [ ] Session marked as completed in Convex
- [ ] Metadata synced to Django

### 3. Goals List Page (`/goals`)

**Display:**
- [ ] Goals load correctly
- [ ] Can create new goal
- [ ] "Start" button on planned goals works
- [ ] "New Session" button on ongoing goals works

**Real-time Updates (Future Enhancement):**
- Currently uses Django API
- Could add real-time active session badges

### 4. Cross-Browser Testing

**Multi-tab Real-time:**
- [ ] Open goal page in Tab A
- [ ] Start session in Tab B
- [ ] Tab A shows new session immediately
- [ ] Both tabs show live XP updates

**Network Interruption:**
- [ ] Pause session
- [ ] Disconnect network
- [ ] Wait 30 seconds
- [ ] Reconnect network
- [ ] Verify session state recovered

### 5. Data Consistency

**Convex ↔ Django Sync:**
- [ ] Start session → Check Django has metadata record
- [ ] Complete session → Verify Django has final stats
- [ ] Check `syncedToDjango` flag in Convex is true
- [ ] XP values match between Convex and Django

**Activity Metadata:**
- [ ] Sessions show correct activity name
- [ ] Activity emoji displays properly
- [ ] Activity type (aspect) is correct

## Common Issues & Fixes

### Issue: Sessions not updating in real-time
**Fix:** Check that `ConvexProvider` wraps the app in `providers.tsx`

### Issue: "No active session" but timer is running
**Fix:** Check userId matching between Django and Convex (string vs number)

### Issue: Activity shows as "Activity 🎯"
**Fix:** Verify `/api/sessions/calculate-rates` returns activity metadata

### Issue: XP not calculating
**Fix:** Check that `rates` are being passed to `startSession` mutation

### Issue: Page refreshes lose session state
**Fix:** Convex persists state, but ensure sessionId is in URL

## Performance Monitoring

### Metrics to Watch

1. **Convex Query Time**
   - `getSessionsByGoal` should be < 100ms
   - Check Convex dashboard for query performance

2. **Heartbeat Frequency**
   - Should fire every 5 seconds
   - Check browser network tab

3. **Real-time Latency**
   - Session updates should appear in < 500ms
   - Open DevTools → Network → WS (WebSocket)

4. **Django Sync Time**
   - Session creation: < 200ms
   - Session completion sync: < 300ms

## Environment Variables

Ensure these are set:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Debugging Tools

### Convex Dashboard
- View live sessions: `sessions` table
- Check query performance
- Monitor WebSocket connections

### Browser DevTools
1. **Network Tab**: Check API calls and heartbeats
2. **WebSocket Tab**: Monitor Convex real-time updates
3. **Console**: Look for `[useGoal]` debug logs
4. **React DevTools**: Inspect `useConvexSessionsByGoal` state

### Useful Queries (Convex Dashboard)

```javascript
// Get all live sessions
db.query("sessions")
  .withIndex("by_user_status", q => q.eq("status", "live"))
  .collect()

// Get sessions for a goal
db.query("sessions")
  .withIndex("by_goal", q => q.eq("goalId", "your-goal-uuid"))
  .collect()

// Check sync status
db.query("sessions")
  .withIndex("by_sync", q => q.eq("syncedToDjango", false))
  .collect()
```

## Next Steps

After testing passes:

1. [ ] Update Django to create `SessionMetadata` model
2. [ ] Add indexes to Django session table
3. [ ] Implement mobile quick-query endpoints
4. [ ] Add real-time leaderboard features
5. [ ] Implement session collaboration (nudges)
