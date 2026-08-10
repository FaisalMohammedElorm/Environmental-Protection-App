# EcoAlert — Backend

REST API for EcoAlert, built with Express, TypeScript, and Supabase (Postgres + Auth + Storage).

## Stack

- **Express 4** + **TypeScript** (strict mode)
- **Supabase Postgres** via **postgres.js** — parameterized SQL, no ORM
- **Supabase Auth** for identity — Express verifies the Supabase-issued JWT locally against its
  JWKS endpoint (`jose`) rather than issuing or storing any credentials itself
- **Supabase Storage** for image storage (`avatars`, `reports` buckets), **Multer** for
  multipart uploads
- **Nodemailer** for the contact form only (auth emails are sent by Supabase Auth)
- **Zod** for request validation, **Winston** + **morgan** for logging
- **Helmet**, **CORS**, **express-rate-limit** for security

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run db:migrate      # one-time — applies supabase/migrations/*.sql to your project
npm run dev              # starts on http://localhost:5000 with ts-node + nodemon
```

Requires a [Supabase](https://supabase.com/dashboard) project — there's no local/offline mode.

## Scripts

| Script            | Purpose                                    |
| ------------------ | ------------------------------------------- |
| `npm run dev`      | Dev server with hot reload (nodemon + ts-node) |
| `npm run build`    | Compile TypeScript to `dist/`               |
| `npm run start`    | Run the compiled build (`dist/server.js`)   |
| `npm run db:migrate` | Apply `supabase/migrations/*.sql` (idempotent — tracks what's already applied) |
| `npm run seed:admin` | One-time: create/promote the first admin account |
| `npm run lint`     | ESLint                                      |
| `npm run format`   | Prettier                                    |
| `npm test`         | Jest (unit + integration, in-band, against your live Supabase project) |
| `npm run test:watch` | Jest in watch mode                        |

## Project structure

```
src/
  config/        env validation, logger, Postgres client (db.ts), Supabase admin client, mailer
  middleware/    auth (Supabase JWT via JWKS), validation, error handling, rate limiting, upload, logging
  routes/        one router per resource, mounted under /api/v1
  controllers/   thin HTTP layer — parses req, calls services, shapes response
  services/      business logic — the only layer that runs SQL directly
  validators/    Zod schemas per resource
  utils/         ApiError, catchAsync, pagination, serializers
  types/         shared enums and Express Request augmentation
  app.ts         Express app factory (middleware pipeline + route mounting)
  server.ts      entrypoint — connects DB, starts HTTP server, graceful shutdown
  scripts/       one-off scripts (db:migrate runner, seed:admin)
tests/           Jest unit/integration/API tests
```

Database schema lives outside `src/`, in `../supabase/migrations/*.sql`.

## Architecture notes

- **Controllers stay thin.** All business logic and SQL queries live in `services/`; controllers only translate HTTP ↔ service calls.
- **Every mutating admin/officer action is audit-logged** via `services/auditLog.service.ts`.
- **Express owns no credentials.** Signup, login, logout, session refresh, password reset, and
  email verification all happen frontend-to-Supabase directly; Express only ever verifies an
  already-issued token.
- **Notifications are created as a side-effect** of report status changes, assignment, and comments (`services/notification.service.ts`), not as a separate manual step.

## API documentation

See [`docs/API.md`](./docs/API.md) for the full endpoint reference with request/response examples.

## Docker

```bash
docker build -t ecoalert-backend .
docker run --env-file .env -p 5000:5000 ecoalert-backend
```

Or use the root-level `docker-compose.yml` to run frontend + backend together (Supabase itself
is a cloud service — nothing else runs locally).
