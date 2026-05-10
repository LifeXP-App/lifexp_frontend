# Linear Summary: LifeXP Frontend and Real-Time Session Integration

## Title

Document LifeXP frontend architecture and Convex-backed real-time session flow

## Summary

Added developer-facing documentation for the LifeXP frontend codebase and a clear surface-level summary of the current Convex + Django session integration.

## What Is Done

- Documented the frontend architecture: Next.js App Router, route groups, providers, auth context, API proxy routes, shared hooks, services, components, and styling conventions.
- Documented the Django integration pattern: frontend calls local Next `/api/*` routes, route handlers attach JWT auth from HTTP-only cookies, refresh once on `401`, then proxy to Django `/api/v1/*`.
- Documented the Convex session system: schema, session lifecycle, mutations, queries, cron jobs, heartbeat behavior, pause/resume, completion, and Django sync.
- Added guidance for adding future Django-backed features and Convex session behavior.
- Added testing and deployment checklists for frontend and real-time session changes.
- Linked the new docs from the README so devs have a clear starting point.

## User-Facing Impact

- Developers can understand the codebase faster and safely continue work without reverse-engineering routing, auth, or session data flow.
- The real-time session feature is easier to hand off: live session timing, XP updates, pause/resume, completion, and reflection flow are documented in one place.
- Future work can be planned more cleanly because known gaps and follow-ups are listed.

## Technical Surface

- Main app shell lives under `app/(main)`.
- Auth and immersive timer flows live under `app/(fullscreen)`.
- Django proxy routes live under `app/api`.
- Convex real-time session logic lives under `convex`.
- Shared client services and hooks live under `src/lib`.
- Shared UI components live under `src/components`.

## Important Notes

- Convex is currently the source of truth for live and completed session runtime data.
- Django remains the source for users, goals, activities, auth, profile data, long-term XP ledger updates, and lightweight session metadata.
- Completed session sync to Django is implemented from the timer flow, but the Convex cron retry job still needs an HTTP action implementation.
- Some older client pages still call `NEXT_PUBLIC_API_BASE_URL` directly. New authenticated work should prefer local Next route handlers.

## Acceptance Criteria

- Developer guide exists in the repo.
- Linear-ready summary exists in the repo.
- README links to the new documentation.
- Existing integration docs remain intact.

## Follow-Ups

- Implement the Convex `retryDjangoSync` HTTP action.
- Consolidate duplicated sidebar component paths.
- Decide on npm or Yarn and clean up lockfile ownership.
- Add automated tests for auth proxy handlers, goal normalization, and session lifecycle utilities.
