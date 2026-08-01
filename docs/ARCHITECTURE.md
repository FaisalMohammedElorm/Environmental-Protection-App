# EcoAlert Architecture

## System overview

```
                    ┌─────────────────────┐
                    │   Next.js frontend    │
                    │  (citizen/officer/    │
                    │   admin dashboards)   │
                    └──────────┬───────────┘
                               │ HTTPS (Axios, JWT bearer + refresh cookie)
                               ▼
                    ┌─────────────────────┐
                    │   Express REST API    │
                    │  (auth, reports,       │
                    │   categories, admin)   │
                    └──────┬────────┬──────┘
                           │        │
              ┌────────────┘        └────────────┐
              ▼                                   ▼
     ┌─────────────────┐               ┌─────────────────────┐
     │     MongoDB       │               │      Cloudinary        │
     │  (Mongoose ODM)   │               │   (report images)      │
     └─────────────────┘               └─────────────────────┘
```

Notifications and audit logs are written synchronously as side-effects of report mutations
(status change, assignment, comments) rather than through a separate queue — appropriate at
this scale, and the service-layer boundary (`services/notification.service.ts`,
`services/auditLog.service.ts`) makes it straightforward to move them behind a queue later
without touching controllers.

## Backend layering

```
routes/        →  validateRequest(zod) →  controller  →  service  →  Mongoose model
```

- **Routes** wire HTTP verbs + paths to middleware and controllers. No logic here.
- **Middleware** (`protect`, `restrictTo`, `validateRequest`, `uploadReportImages`) runs before
  controllers and is fully reusable across resources.
- **Controllers** are thin — they read `req`, call one or more service functions, and shape the
  HTTP response. No Mongoose queries here.
- **Services** hold all business logic and are the only layer that imports Mongoose models
  directly. This is what's under test in `tests/unit`.
- **Serializers** (`utils/serializers/*`) convert Mongoose documents into the exact JSON shape
  the frontend's TypeScript types expect — kept separate from services so the same document can
  be serialized differently for different audiences later without touching business logic.

## Database design

| Collection      | Purpose                                                             | Key indexes |
| ---------------- | -------------------------------------------------------------------- | ------------ |
| `users`          | Accounts for citizens, officers, admins                              | `email` (unique), `role`, text(`name`,`email`) |
| `reports`        | The core entity — one per filed environmental issue                  | `status+category+severity`, `reportedBy`, `assignedTo`, geo fields, text(`description`,`location.address`) |
| `categories`     | Admin-managed metadata layer over the report category enum           | `name` (unique), `slug` (unique) |
| `comments`       | Threaded discussion on a report, separate collection (not embedded)  | `report+createdAt` |
| `notifications`  | Per-user notification feed                                           | `user+isRead+createdAt` |
| `auditlogs`      | Immutable record of officer/admin actions                            | `createdAt`, `actor` |
| `settings`       | Singleton document for platform-wide configuration                   | — |
| `tokens`         | Hashed refresh/verification/reset tokens with TTL auto-expiry         | `expiresAt` (TTL), `user+type` |

Design choices worth calling out:

- **Comments are a separate collection**, not embedded in `Report`, so comment volume never
  bloats the report document and both can be queried/paginated independently.
- **Refresh, verification, and reset tokens are never JWTs.** They're random tokens, SHA-256
  hashed before storage, with a MongoDB TTL index (`expireAfterSeconds: 0` on `expiresAt`) so
  MongoDB itself garbage-collects expired tokens — no cron job required.
- **`Report.category` is a fixed enum**, validated by Zod and Mongoose, while the `Category`
  collection is an admin-editable metadata/display layer (description, active/inactive, live
  report counts) layered on top of it. Extending the platform with a genuinely new category
  means adding it to the shared enum (`types/enums.ts` on the backend, `types/report.ts` on the
  frontend) as well as creating the `Category` document — a deliberate one-place-to-extend
  design rather than a free-text category field with no validation.

## Frontend structure

```
src/
  app/            Next.js App Router — one folder per route
  components/
    landing/       Marketing page sections
    dashboard/      Sidebar, topbar, badges shared across citizen/officer/admin
    ui/             Generic primitives (Input, Button, Select, Skeleton, EmptyState, ...)
    analytics/      Shared chart dashboard (officer + admin both render this)
    providers/      React Query, toasts, theme
  lib/
    api/            One file per resource — thin Axios wrappers, typed request/response
    validators/     Zod schemas mirrored 1:1 with the backend's
  hooks/            React Query hooks (e.g. useCurrentUser)
  types/            Shared TypeScript types, mirrored 1:1 with backend serializers
```

The frontend's `lib/validators/*` and the backend's `src/validators/*` intentionally define the
same constraints (password rules, min/max lengths, enums) independently on each side — the
frontend copy is for instant UX feedback, the backend copy is the actual authority. Neither
trusts the other.

## Future-ready extension points

- **AI classification**: `Report.images` already stores Cloudinary URLs; an async worker could
  call a classification model post-upload and write results to a new `Report.aiClassification`
  field without changing the write path.
- **IoT sensor ingestion**: a `sensors` collection and a `POST /api/v1/sensors/readings` endpoint
  (API-key authenticated, not user-JWT authenticated) would slot in alongside the existing
  resource modules using the same routes → controller → service pattern.
- **SMS/push notifications**: `services/notification.service.ts` already centralizes every
  notification-worthy event; adding a channel means adding a dispatch call there, not touching
  report/comment/assignment logic.
