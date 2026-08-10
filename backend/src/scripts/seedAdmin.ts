/**
 * Creates the first admin account on a fresh deployment.
 *
 * Without this, there is no way to reach the admin dashboard at all — every
 * signup defaults to "citizen", and promoting someone to "admin" requires
 * an existing admin to call PATCH /admin/users/:id/role.
 *
 * Usage:
 *   ADMIN_NAME="Ama Owusu" ADMIN_EMAIL=admin@ecoalert.app ADMIN_PASSWORD=... npm run seed:admin
 *
 * Safe to re-run: if an admin account already exists, it does nothing.
 */
import { sql, connectDatabase, disconnectDatabase } from "../config/db";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { logger } from "../config/logger";

export async function seedAdmin(): Promise<void> {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    logger.error(
      "Missing required env vars. Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD before running this script."
    );
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    logger.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const [existingAdmin] = await sql<{ email: string }[]>`
    select email from public.profiles where role = 'admin' limit 1
  `;
  if (existingAdmin) {
    logger.info(`An admin account already exists (${existingAdmin.email}). Nothing to do.`);
    return;
  }

  const [existingProfile] = await sql<{ id: string }[]>`
    select id from public.profiles where email = ${email}
  `;
  if (existingProfile) {
    await sql`update public.profiles set role = 'admin', is_active = true where id = ${existingProfile.id}`;
    logger.info(`Promoted existing user ${email} to admin.`);
    return;
  }

  // Creates the auth.users row directly (bypassing the normal signup/email-
  // confirmation flow) — handle_new_user then auto-creates the matching
  // 'citizen' profile row, which we immediately promote below.
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });

  if (error || !data.user) {
    throw new Error(`Failed to create admin auth user: ${error?.message ?? "unknown error"}`);
  }

  await sql`update public.profiles set role = 'admin' where id = ${data.user.id}`;

  logger.info(`Admin account created: ${email}`);
}

/* istanbul ignore next -- CLI entrypoint, exercised via the exported seedAdmin() in tests instead */
async function runAsCli(): Promise<void> {
  await connectDatabase();
  try {
    await seedAdmin();
  } finally {
    await disconnectDatabase();
  }
}

// Only run as a script when invoked directly (`npm run seed:admin`), not when
// imported by tests — importing this module must never have side effects.
if (require.main === module) {
  runAsCli().catch((error) => {
    logger.error(`Failed to seed admin: ${(error as Error).message}`);
    process.exitCode = 1;
  });
}
