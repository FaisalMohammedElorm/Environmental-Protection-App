# EcoAlert — Backend

REST API for EcoAlert, built with Express, TypeScript, and MongoDB (Mongoose).

## Stack

- **Express 4** + **TypeScript** (strict mode)
- **MongoDB** via **Mongoose 8**
- **JWT** access tokens + DB-backed, hashed, rotating refresh tokens (httpOnly cookie)
- **Cloudinary** for image storage, **Multer** for multipart uploads
- **Nodemailer** for transactional email (verification, password reset)
- **Zod** for request validation, **Winston** + **morgan** for logging
- **Helmet**, **CORS**, **express-rate-limit**, **express-mongo-sanitize** for security

## Getting started

```bash
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT secrets, etc.
npm run dev             # starts on http://localhost:5000 with ts-node + nodemon
```

Requires a running MongoDB instance — either local (`mongodb://localhost:27017/ecoalert`) or Atlas.

## Scripts

| Script            | Purpose                                    |
| ------------------ | ------------------------------------------- |
| `npm run dev`      | Dev server with hot reload (nodemon + ts-node) |
| `npm run build`    | Compile TypeScript to `dist/`               |
| `npm run start`    | Run the compiled build (`dist/server.js`)   |
| `npm run lint`     | ESLint                                      |
| `npm run format`   | Prettier                                    |
| `npm test`         | Jest (unit + integration, in-band)          |
| `npm run test:watch` | Jest in watch mode                        |

## Project structure

```
src/
  config/        env validation, logger, DB connection, Cloudinary, mailer
  models/        Mongoose schemas (User, Report, Category, Comment, Notification, AuditLog, Settings, Token)
  middleware/    auth (JWT), validation, error handling, rate limiting, upload, logging
  routes/        one router per resource, mounted under /api/v1
  controllers/   thin HTTP layer — parses req, calls services, shapes response
  services/      business logic — the only layer that touches Mongoose models directly
  validators/    Zod schemas per resource
  utils/         ApiError, catchAsync, pagination, JWT signing, serializers
  types/         shared enums and Express Request augmentation
  app.ts         Express app factory (middleware pipeline + route mounting)
  server.ts      entrypoint — connects DB, starts HTTP server, graceful shutdown
tests/           Jest unit/integration/API tests
```

## Architecture notes

- **Controllers stay thin.** All business logic and Mongoose queries live in `services/`; controllers only translate HTTP ↔ service calls.
- **Every mutating admin/officer action is audit-logged** via `services/auditLog.service.ts`.
- **Refresh tokens are never stored as JWTs.** They're random tokens, hashed (SHA-256) before being stored in the `Token` collection with a TTL index, and rotated on every use.
- **Notifications are created as a side-effect** of report status changes, assignment, and comments (`services/notification.service.ts`), not as a separate manual step.

## API documentation

See [`docs/API.md`](./docs/API.md) for the full endpoint reference with request/response examples.

## Docker

```bash
docker build -t ecoalert-backend .
docker run --env-file .env -p 5000:5000 ecoalert-backend
```

Or use the root-level `docker-compose.yml` to run frontend + backend + MongoDB together.
