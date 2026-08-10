# EcoAlert API Reference

Base URL: `/api/v1`

All request/response bodies are JSON unless noted. Authenticated endpoints require an
`Authorization: Bearer <token>` header, where `<token>` is the `access_token` from a Supabase
Auth session — Express verifies it against Supabase's JWKS endpoint on every request.

## Authentication

There are no `/auth/*` endpoints on this API. Signup, login, logout, session refresh,
password reset, and email verification all go directly from the frontend to Supabase Auth
(`supabase.auth.*` via `@supabase/ssr`/`supabase-js`) — Express never sees a password and
issues no tokens of its own. See `docs/ARCHITECTURE.md` for the full flow.

## Reports

All endpoints below require authentication (🔒). Officer/admin-only endpoints are marked 👮.

### `POST /reports` 🔒
`multipart/form-data` with fields `category`, `severity`, `description`, `address`, `latitude`,
`longitude`, and up to 8 `images` files (JPEG/PNG/WEBP, 5MB each).

### `GET /reports` 👮
Query params: `status`, `category`, `severity`, `search`, `page`, `limit`. Returns all reports
(paginated) — officers and admins only.

### `GET /reports/mine` 🔒
Same query params, scoped to the current user's own reports.

### `GET /reports/:id` 🔒

### `PATCH /reports/:id` 🔒
Citizen can edit their own report's `category`, `severity`, `description`, `address` — only
while the report is still in `new` status. Admins can edit anytime.

### `DELETE /reports/:id` 🔒
Owner or admin only.

### `PATCH /reports/:id/status` 👮
Request: `{ "status": "under_review" | "assigned" | "in_progress" | "resolved" | "rejected" }`.
Triggers a notification to the reporter.

### `PATCH /reports/:id/assign` 👮
Request: `{ "officerId": "..." }`. Triggers a notification to the reporter.

### `POST /reports/:id/comments` 🔒
Request: `{ "body": "..." }`. Triggers a notification to the reporter (unless they're the author).

## Categories

### `GET /categories`
Public. Returns all categories with live report counts.

### `POST /categories` 👮 (admin only)
### `PATCH /categories/:id` 👮 (admin only)
### `DELETE /categories/:id` 👮 (admin only)

## Notifications 🔒

### `GET /notifications`
Query: `page`, `limit`. Paginated, newest first.

### `PATCH /notifications/:id/read`
### `POST /notifications/read-all`

## Users (self-service) 🔒

### `PATCH /users/me`
Request: `{ "name"?, "phone"? }`. Email and password changes go through Supabase Auth directly
(`supabase.auth.updateUser(...)`) — not this endpoint.

### `POST /users/me/avatar`
`multipart/form-data`, field `avatar` (JPEG/PNG/WEBP, 5MB max). Stored in the public
`avatars` Supabase Storage bucket.

## Admin (admin only) 👮

### `GET /admin/users`
Query: `role`, `search`, `page`, `limit`.

### `PATCH /admin/users/:id/status`
Request: `{ "isActive": boolean }`.

### `PATCH /admin/users/:id/role`
Request: `{ "role": "citizen" | "officer" | "admin" }`.

### `GET /admin/audit-logs`
Query: `page`, `limit`.

### `GET /admin/settings`
### `PUT /admin/settings`
Request: full `{ siteName, supportEmail, autoAssignReports, reportResolutionSlaHours, allowPublicReportSubmission }`.

## Analytics

### `GET /analytics/summary` 👮 (officer or admin)
Returns `{ totalReports, resolvedReports, pendingReports, totalUsers, categoryDistribution[], monthlyTrends[], officerPerformance[] }`.

## Contact

### `POST /contact`
Public. Request: `{ "name", "email", "subject", "message" }`.

## Error format

All errors follow the same shape:
```json
{ "message": "Human-readable summary", "errors": { "body.email": ["Enter a valid email"] } }
```
`errors` is only present for validation failures (400).
