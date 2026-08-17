# EcoAlert Architecture

## System overview

```
                    ┌───────────────────────┐
                    │    Next.js frontend     │
                    │  (citizen/officer/      │
                    │   admin dashboards)     │
                    └───┬─────────────────┬───┘
                        │                 │
   client components,   │                 │  two Server Actions only:
   server components,   │                 │  report-image upload/signed URLs,
   middleware — all via │                 │  contact-form email (need a
   supabase-js/@supabase/ssr             │  secret or server-side validation)
                        ▼                 ▼
              ┌─────────────────────┐   ┌──────────────────────┐
              │  Supabase Postgres    │   │  Supabase Storage       │
              │  RLS on every table,  │   │  avatars (public,       │
              │  triggers for         │   │  client-writable) +     │
              │  notifications/audit  │   │  reports (private,      │
              │  log, RPCs for        │   │  Server-Action-only)    │
              │  admin/analytics      │   └──────────────────────┘
              └──────────┬───────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Supabase Auth         │
              │  (auth.users)          │
              └─────────────────────┘
```

There is no backend server. The Next.js app talks to Supabase directly — client components and
server components read/write through Row Level Security, and two small Server Actions
(`src/app/actions/`) exist only where a real secret is involved: uploading report images to a
private Storage bucket (needs the service-role key) and sending contact-form email (needs SMTP
credentials). Everything else — auth, reports, comments, categories, notifications, admin user
management, audit logs, analytics — goes straight from the browser or a Server/Client Component
to Supabase's PostgREST API, protected by RLS.

Auth is fully Supabase-native: the browser talks to Supabase Auth directly (`@supabase/ssr`) for
signup/login/logout/session; `middleware.ts` re-verifies the session server-side on every request
to `/dashboard`, `/admin`, `/officer` and redirects based on the caller's `profiles.role`.

Business logic that used to live in an Express service layer (notification side-effects on report
status/assignment/comments, audit logging on report/category/user/settings mutations, a
column-level edit-restriction rule for report content, two aggregation-heavy admin queries) now
lives in Postgres itself — see `supabase/migrations/0011_client_direct_access.sql` — as triggers
and `SECURITY DEFINER` functions/RPCs, following the same pattern the schema already used for
`handle_new_user` and `prevent_privilege_escalation`.

## Where logic lives

| Concern | Lives in |
|---|---|
| Auth (signup/login/logout/session) | Supabase Auth, called directly from the browser |
| Route protection | `frontend/src/middleware.ts` (server-verified session + role check) |
| Simple reads/writes (reports, comments, categories, notifications, profile) | Direct Supabase client calls, protected by RLS |
| Full-text search | PostgREST `.textSearch()` against generated `search` tsvector columns |
| Report content-edit restriction (officers: status/assignment only; owner-while-new or admin: content only) | `reports_guard_update()` trigger |
| Notification side effects | `notify_report_status_or_assignment()`, `notify_report_comment()` triggers |
| Audit logging | `audit_report_changes()`, `audit_category_changes()`, `audit_profile_role_changes()`, `audit_settings_changes()` triggers |
| Admin user listing (with per-officer report stats) | `admin_list_users()` RPC, admin-gated |
| Analytics summary (aggregations across all reports) | `get_analytics_summary()` RPC, staff-gated |
| Report-image upload + signed URLs | `src/app/actions/reports.ts` Server Actions (service-role key, magic-byte validation) |
| Avatar upload | Direct client-side Storage upload — `avatars` bucket RLS already allows it |
| Contact-form email | `src/app/actions/contact.ts` Server Action (SMTP credentials) |

## Database design

Schema lives in `supabase/migrations/*.sql`, applied via `npm run db:migrate` in `scripts/`
(standalone, not part of the deployed app — see `scripts/README.md`).

| Table           | Purpose                                                             | Key indexes |
| ---------------- | -------------------------------------------------------------------- | ------------ |
| `profiles`       | One row per `auth.users` row (auto-created by a trigger on signup) — name, role, phone, avatar | `role`, GIN(`search`) over name+email |
| `reports`        | The core entity — one per filed environmental issue                  | `status+category_id+severity`, `reported_by`, `assigned_to`, lat/lng, GIN(`search`) over description+address |
| `categories`     | Admin-managed metadata layer, FK'd from `reports.category_id`        | `name` (unique), `slug` (unique) |
| `comments`       | Threaded discussion on a report, separate table (not embedded)       | `report_id+created_at` |
| `notifications`  | Per-user notification feed, Realtime-enabled                         | `user_id+is_read+created_at` |
| `audit_logs`     | Record of officer/admin actions (actor snapshot survives account deletion) | `created_at`, `actor_id` |
| `settings`       | Singleton row for platform-wide configuration (`id boolean` PK trick) | — |

Design choices worth calling out:

- **`role`, `report_status`, `report_severity`, `notification_type` are native Postgres `ENUM`
  types**, declared in ordinal order (`new < under_review < ...`, `low < moderate < high <
  critical`). Sorting reports by status/severity is a plain `ORDER BY` — no manual rank
  expression needed.
- **`reports.category_id` is a real foreign key** (`ON DELETE RESTRICT`), so deleting a category
  still referenced by reports fails loudly instead of silently orphaning data.
- **Full-text search uses generated `tsvector` columns + GIN indexes** (`reports.search`,
  `profiles.search`).
- **Row Level Security is enabled on every table** and is the actual, sole authorization
  boundary now — there's no privileged backend connection bypassing it anymore. See
  `supabase/migrations/0002` through `0009` for the base policies and `0011` for the triggers/RPCs
  that close the gaps a pure RLS-only design would otherwise have (column-level restrictions,
  system-generated rows, admin-scoped aggregations).
- **Supabase Storage has two buckets**: `avatars` (public read, owner-scoped write via a
  `{user_id}/...` path, fully client-writable) and `reports` (private, zero client-facing
  policies by design — upload and signed-URL reads both go through the Server Actions in
  `src/app/actions/reports.ts`, which do magic-byte content validation before writing).

## Frontend structure

```
src/
  app/
    actions/        Server Actions — report-image upload/signed URLs, contact-form email.
                     The only server-side code in the app; everything else is client/RSC.
    ...              Next.js App Router — one folder per route
  middleware.ts       Server-side route guard for /dashboard, /admin, /officer
  components/
    landing/          Marketing page sections
    dashboard/        Sidebar, topbar, badges shared across citizen/officer/admin
    ui/                Generic primitives (Input, Button, Select, Skeleton, EmptyState, ...)
    analytics/         Shared chart dashboard (officer + admin both render this)
    providers/         React Query, toasts, theme
  lib/
    supabase/          Browser (`client.ts`) and Server Component/middleware (`server.ts`) Supabase clients
    server/            Server-only utilities used by Server Actions (e.g. image magic-byte validation)
    api/               One file per resource — thin wrappers around Supabase calls (and the two
                       Server Actions), typed request/response, same function signatures as before
                       so pages barely changed when the data layer moved off Express
    validators/        Zod schemas for client-side form validation
  hooks/               React Query hooks (e.g. useCurrentUser — reads the Supabase session + profiles row)
  types/               Shared TypeScript types
```

`middleware.ts` protects `/dashboard`, `/admin`, `/officer` server-side: it checks the Supabase
session cookie and the caller's `profiles.role` before the page renders, redirecting
unauthenticated visitors to `/login` and wrong-role visitors to their own area. RLS is the real
security boundary underneath regardless of which route a request hits.

## Known gaps

- **Changing your account email isn't wired up in the UI.** Supabase Auth owns email changes
  (its own confirmation-link flow via `supabase.auth.updateUser({ email })`); the profile page
  shows email read-only rather than half-implementing that flow.
- **Analytics monthly-trends ordering** (`get_analytics_summary()`) returns the oldest 12 months
  of data once the app has more than a year of reports, not the most recent 12 — inherited as-is
  from the original query rather than silently changed during the Supabase-only migration; worth
  revisiting separately.
- **No IP-based rate limiting** on the contact form (the old Express `express-rate-limit`
  middleware had no clean serverless equivalent worth building for one low-value form).

## Future-ready extension points

- **AI classification**: `reports.images` already stores Supabase Storage paths; an async worker
  could call a classification model post-upload and write results to a new
  `reports.ai_classification` column without changing the write path.
- **IoT sensor ingestion**: a `sensors` table plus a dedicated Server Action or Edge Function
  (API-key authenticated, not user-session authenticated) would slot in alongside the existing
  RLS-protected resources.
- **SMS/push notifications**: the notification triggers in `0011_client_direct_access.sql`
  already centralize every notification-worthy event; adding a channel means adding a dispatch
  step there (or a `pg_net`/Edge Function call from the trigger), not touching report/comment/
  assignment logic.
