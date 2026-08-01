# EcoAlert API Reference

Base URL: `/api/v1`

All request/response bodies are JSON unless noted. Authenticated endpoints require an
`Authorization: Bearer <accessToken>` header. The refresh token is managed automatically via
an httpOnly cookie scoped to `/api/v1/auth` — it is never exposed to client-side JavaScript.

## Authentication

### `POST /auth/register`
Create a citizen account. Sends a verification email (no-op if SMTP isn't configured).

Request:
```json
{ "name": "Ama Owusu", "email": "ama@example.com", "phone": "+233550000000", "password": "Str0ngPass" }
```
Response `201`:
```json
{ "user": { "id": "...", "name": "Ama Owusu", "email": "ama@example.com", "role": "citizen", "isEmailVerified": false, "createdAt": "..." }, "accessToken": "..." }
```

### `POST /auth/login`
Request: `{ "email": "...", "password": "..." }`
Response `200`: same shape as register.

### `POST /auth/refresh-token`
No body — reads the refresh token from the cookie. Requires an `X-CSRF-Token` header matching
the (non-httpOnly) `csrfToken` cookie set on login/register — this is the only pair of endpoints
that authenticate purely via cookie, so they're the only ones that need CSRF protection.
Response `200`: `{ "accessToken": "..." }`.

### `POST /auth/logout`
Same CSRF requirement as above. Revokes the current refresh token and clears both cookies.

### `POST /auth/forgot-password`
Request: `{ "email": "..." }`. Always returns `200` regardless of whether the email exists.

### `POST /auth/reset-password`
Request: `{ "token": "...", "password": "..." }`.

### `POST /auth/verify-email`
Request: `{ "token": "..." }`.

### `GET /auth/me` 🔒
Returns the current authenticated user.

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
Request: `{ "name"?, "email"?, "phone"? }`.

### `POST /users/me/change-password`
Request: `{ "currentPassword", "newPassword" }`.

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
