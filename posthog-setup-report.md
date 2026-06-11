<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the LifeXP Next.js App Router frontend. The setup covers client-side event capture, server-side event capture, user identification, error tracking, and a reverse-proxy configuration for ad-blocker resilience.

**Infrastructure changes:**
- `instrumentation-client.ts` — initialises PostHog on the client using the `instrumentation-client` pattern (correct for Next.js 15.3+), enabling automatic pageview capture, session replay, and exception tracking.
- `next.config.ts` — adds `/ingest/*` rewrites so PostHog requests route through the app's own domain, bypassing ad blockers.
- `src/lib/posthog-server.ts` — singleton PostHog Node.js client used by server-side route handlers.
- `.env.local` — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` added.

**Client-side events:**

| Event | Description | File |
|---|---|---|
| `user_signed_in` | User successfully signs in with email/password | `src/context/AuthContext.tsx` |
| `user_registered` | User completes registration (email confirmation pending) | `src/context/AuthContext.tsx` |
| `user_signed_in_with_google` | User initiates Google OAuth sign-in flow | `src/context/AuthContext.tsx` |
| `user_logged_out` | User explicitly logs out | `src/context/AuthContext.tsx` |
| `goal_created` | Goal successfully created (optimistic UI confirmed) | `app/(main)/goals/page.tsx` |
| `goal_deleted` | User discards/deletes a planned goal | `app/(main)/goals/page.tsx` |
| `goal_status_changed` | Goal status changed (e.g. ongoing → paused) | `app/(main)/goals/page.tsx` |
| `session_started` | New timed session started in Convex | `app/(fullscreen)/goals/[goalId]/session/[sessionId]/page.tsx` |
| `session_completed` | User manually completes a session | `app/(fullscreen)/goals/[goalId]/session/[sessionId]/page.tsx` |
| `session_abandoned` | User abandons a session | `app/(fullscreen)/goals/[goalId]/session/[sessionId]/page.tsx` |
| `session_paused` | User pauses an active session | `app/(fullscreen)/goals/[goalId]/session/[sessionId]/page.tsx` |
| `session_resumed` | User resumes a paused session | `app/(fullscreen)/goals/[goalId]/session/[sessionId]/page.tsx` |
| `reflection_viewed` | User lands on post-session reflection page | `app/(fullscreen)/goals/[goalId]/session/[sessionId]/reflection/page.tsx` |
| `search_performed` | User submits a non-empty search query (debounced 600ms) | `app/(main)/search/page.tsx` |
| `user_followed` | User follows another user | `app/(main)/u/[username]/page.tsx` |
| `user_followed` (unfollow) | User unfollows another user (same event, `action: "unfollow"`) | `app/(main)/u/[username]/page.tsx` |

**Server-side events:**

| Event | Description | File |
|---|---|---|
| `goal_created_server` | Server confirms goal persisted to Django | `app/api/goals/route.ts` |
| `session_synced_server` | Server confirms completed session synced to Django | `app/api/sessions/[sessionId]/route.ts` |

**User identification:**  
`posthog.identify(email, { email })` is called immediately after a successful email/password sign-in, linking the PostHog anonymous ID to the user's email address. `posthog.reset()` is called on logout to unlink the identity.

**Error tracking:**  
`posthog.captureException()` is wired into the sign-up flow, goal deletion, session complete/abandon, and reflection fetch — covering the key failure paths.

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/459155/dashboard/1682804)
- [Daily Sign-ins](https://us.posthog.com/project/459155/insights/sTtwkRm3) — Unique users signing in per day
- [Session completion vs abandonment](https://us.posthog.com/project/459155/insights/oc7ZkqNM) — Key churn signal
- [Sign-up to session completion funnel](https://us.posthog.com/project/459155/insights/jY0UUcTW) — Core LifeXP activation funnel
- [Goal lifecycle](https://us.posthog.com/project/459155/insights/GjRHjgdg) — Goal creation, status changes, and deletions
- [New registrations over time](https://us.posthog.com/project/459155/insights/akAMMW25) — Growth signal

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
