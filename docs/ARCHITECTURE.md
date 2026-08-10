# EcoAlert Architecture

## System overview

```
                    ┌─────────────────────┐
                    │   Next.js frontend    │
                    │  (citizen/officer/    │
                    │   admin dashboards)   │
                    └──────┬─────────┬─────┘
                           │         │
        auth: supabase-js  │         │  data: Axios, Bearer <supabase JWT>
        (direct to Supabase)         ▼
                           │  ┌─────────────────────┐
                           │  │   Express REST API    │
                           │  │  (reports, categories, │
                           │  │   admin, analytics)    │
                           │  └──────────┬───────────┘
                           ▼             │ postgres.js (service-role trust,
                  ┌─────────────────┐    │  bypasses RLS)
                  │  Supabase Auth    │   ▼
                  │  (auth.users)     │  ┌─────────────────────┐
                  └────────┬──────────┘  │  Supabase Postgres    │
                           │ handle_new_user trigger │ (RLS on every table)│
                           └─────────────►└─────────────────────┘
                                                    │
                                                    ▼
                                          ┌─────────────────────┐
                                          │  Supabase Storage      │
                                          │  (avatars, reports)    │
                                          └─────────────────────┘
```

Auth is frontend-driven: the browser talks to Supabase Auth directly (`@supabase/ssr`) for
signup/login/logout/session — Express never sees a password and owns none of that flow. Every
other request carries the resulting Supabase access token as a Bearer header; Express verifies
it locally against Supabase's JWKS endpoint (`middleware/auth.ts`), loads the caller's
`profiles` row for role/name, and proceeds exactly as before. Express's own Postgres connection
uses the project's `postgres` role, which — like any table owner — bypasses Row Level Security;
RLS is still fully defined on every table as defense-in-depth for the parallel PostgREST/anon-key
path Supabase exposes automatically, not as the mechanism Express itself relies on for
authorization (Express keeps doing that in application code, same as before).

Notifications and audit logs are written synchronously as side-effects of report mutations
(status change, assignment, comments) rather than through a separate queue — appropriate at
this scale, and the service-layer boundary (`services/notification.service.ts`,
`services/auditLog.service.ts`) makes it straightforward to move them behind a queue later
without touching controllers.

## Backend layering

```
routes/        →  validateRequest(zod) →  controller  →  service  →  postgres.js (parameterized SQL)
```

- **Routes** wire HTTP verbs + paths to middleware and controllers. No logic here.
- **Middleware** (`protect`, `restrictTo`, `validateRequest`, `uploadReportImages`) runs before
  controllers and is fully reusable across resources. `protect` verifies the Supabase JWT via
  JWKS (`jose`) and attaches `{id, name, role}` from `profiles` to `req.user`.
- **Controllers** are thin — they read `req`, call one or more service functions, and shape the
  HTTP response. No SQL here.
- **Services** hold all business logic and are the only layer that runs SQL directly, via the
  shared `sql` (postgres.js) client in `config/db.ts`. This is what's under test in `tests/unit`.
- **Serializers** (`utils/serializers/*`) convert raw Postgres rows (snake_case) into the exact
  camelCase JSON shape the frontend's TypeScript types expect — kept separate from services so
  the same row can be serialized differently for different audiences later without touching
  business logic.

## Database design

Schema lives in `supabase/migrations/*.sql`, applied via `npm run db:migrate` (backend).

| Table           | Purpose                                                             | Key indexes |
| ---------------- | -------------------------------------------------------------------- | ------------ |
| `profiles`       | One row per `auth.users` row (auto-created by a trigger on signup) — name, role, phone, avatar | `role`, GIN(`search`) over name+email |
| `reports`        | The core entity — one per filed environmental issue                  | `status+category_id+severity`, `reported_by`, `assigned_to`, lat/lng, GIN(`search`) over description+address |
| `categories`     | Admin-managed metadata layer, FK'd from `reports.category_id`        | `name` (unique), `slug` (unique) |
| `comments`       | Threaded discussion on a report, separate table (not embedded)       | `report_id+created_at` |
| `notifications`  | Per-user notification feed                                           | `user_id+is_read+created_at` |
| `audit_logs`     | Record of officer/admin actions (actor snapshot survives account deletion) | `created_at`, `actor_id` |
| `settings`       | Singleton row for platform-wide configuration (`id boolean` PK trick) | — |

There is no `tokens` table — Supabase Auth owns refresh tokens, email-verification tokens, and
password-reset tokens natively.

Design choices worth calling out:

- **`role`, `report_status`, `report_severity`, `notification_type` are native Postgres
  `ENUM` types**, declared in ordinal order (`new < under_review < ...`, `low < moderate <
  high < critical`). Sorting reports by status/severity is a plain `ORDER BY` — no manual rank
  expression needed, unlike the old Mongo aggregation.
- **`reports.category_id` is a real foreign key** (`ON DELETE RESTRICT`) rather than a bare
  string, so deleting a category still referenced by reports fails loudly instead of silently
  orphaning data.
- **Full-text search uses generated `tsvector` columns + GIN indexes** (`reports.search`,
  `profiles.search`) instead of application-side substring matching.
- **Row Level Security is enabled on every table**, with real policies (own-row-or-staff for
  reports/comments, own-row-only for notifications, admin-only for audit_logs/settings) — see
  the migration files for the exact rules. This matters even though Express's own connection
  bypasses it: Supabase exposes every table over a public PostgREST API via the anon key
  regardless of what Express does.
- **Supabase Storage has two buckets**: `avatars` (public read, owner-scoped write via a
  `{user_id}/...` path convention) and `reports` (private — Express is the only reader/writer,
  issuing short-lived signed URLs on read rather than exposing permanent public links).

## Frontend structure

```
src/
  app/            Next.js App Router — one folder per route
  middleware.ts    Server-side route guard for /dashboard, /admin, /officer
  components/
    landing/       Marketing page sections
    dashboard/      Sidebar, topbar, badges shared across citizen/officer/admin
    ui/             Generic primitives (Input, Button, Select, Skeleton, EmptyState, ...)
    analytics/      Shared chart dashboard (officer + admin both render this)
    providers/      React Query, toasts, theme
  lib/
    supabase/       Browser (`client.ts`) and Server Component/middleware (`server.ts`) Supabase clients
    api/            One file per resource — thin Axios wrappers to Express, typed request/response;
                     `api/auth.ts` wraps supabase-js directly instead (signup/login/logout/etc. don't go through Express)
    validators/     Zod schemas mirrored 1:1 with the backend's
  hooks/            React Query hooks (e.g. useCurrentUser — reads the Supabase session + profiles row)
  types/            Shared TypeScript types, mirrored 1:1 with backend serializers
```

The frontend's `lib/validators/*` and the backend's `src/validators/*` intentionally define the
same constraints (password rules, min/max lengths, enums) independently on each side — the
frontend copy is for instant UX feedback, the backend copy is the actual authority. Neither
trusts the other.

`middleware.ts` protects `/dashboard`, `/admin`, `/officer` server-side: it checks the Supabase
session cookie and the caller's `profiles.role` before the page renders, redirecting
unauthenticated visitors to `/login` and wrong-role visitors to their own area.

## Known gaps

- **Changing your account email isn't wired up in the UI.** Supabase Auth owns email changes
  (its own confirmation-link flow via `supabase.auth.updateUser({ email })`); the profile page
  shows email read-only rather than half-implementing that flow. Building it is additive — a
  new form calling that one method plus a confirmation landing page, no schema changes needed.

## Future-ready extension points

- **AI classification**: `reports.images` already stores Supabase Storage paths; an async
  worker could call a classification model post-upload and write results to a new
  `reports.ai_classification` column without changing the write path.
- **IoT sensor ingestion**: a `sensors` table and a `POST /api/v1/sensors/readings` endpoint
  (API-key authenticated, not user-JWT authenticated) would slot in alongside the existing
  resource modules using the same routes → controller → service pattern.
- **SMS/push notifications**: `services/notification.service.ts` already centralizes every
  notification-worthy event; adding a channel means adding a dispatch call there, not touching
  report/comment/assignment logic.
