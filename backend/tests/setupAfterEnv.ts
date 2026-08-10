// Environment variables must be set before any module (e.g. src/config/env.ts) is imported,
// since that module validates process.env at import time. backend/.env (dotenv, loaded by
// config/env.ts itself) supplies the real Supabase project values — these tests run against
// that live project's Postgres + Auth rather than an ephemeral local database, since this
// project has no Docker available for a local Postgres and Supabase signs tokens with an
// asymmetric key that can't be forged locally either way.
process.env.NODE_ENV = "test";

import { sql } from "../src/config/db";
import { supabaseAdmin } from "../src/config/supabaseAdmin";
import { ensureDefaultCategories } from "../src/services/category.service";
import { resetCreatedUserIds, getCreatedUserIds } from "./helpers";

beforeAll(() => {
  resetCreatedUserIds();
});

beforeEach(async () => {
  // Report category is validated against the live categories table rather than a fixed
  // enum — seed the defaults before every test so tests that create reports with e.g.
  // category: "illegal_dumping" keep working unchanged.
  await ensureDefaultCategories();
});

afterEach(async () => {
  // Wipes categories, reports, comments, notifications, and audit_logs (CASCADE picks up
  // everything that references them) between every test, mirroring the old Mongo
  // deleteMany({})-on-every-collection reset. profiles/auth users are deliberately left
  // alone here — they're cleaned up once per file in afterAll below — and settings is
  // reset back to its column defaults instead of being wiped (it's a singleton row).
  await sql`truncate table public.categories, public.reports, public.comments, public.notifications, public.audit_logs cascade`;
  await sql`
    update public.settings
    set
      site_name = default,
      support_email = default,
      auto_assign_reports = default,
      report_resolution_sla_hours = default,
      allow_public_report_submission = default
    where id = true
  `;
});

afterAll(async () => {
  const ids = getCreatedUserIds();
  await Promise.all(
    ids.map((id) => supabaseAdmin.auth.admin.deleteUser(id).catch(() => undefined))
  );
  await sql.end();
});
