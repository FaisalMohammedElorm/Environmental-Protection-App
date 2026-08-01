/**
 * Creates the first admin account on a fresh deployment.
 *
 * Without this, there is no way to reach the admin dashboard at all — every
 * registration defaults to "citizen", and promoting someone to "admin" requires
 * an existing admin to call PATCH /admin/users/:id/role.
 *
 * Usage:
 *   ADMIN_NAME="Ama Owusu" ADMIN_EMAIL=admin@ecoalert.app ADMIN_PASSWORD=... npm run seed:admin
 *
 * Safe to re-run: if an admin account already exists, it does nothing.
 */
import { connectDatabase, disconnectDatabase } from "../config/db";
import { logger } from "../config/logger";
import { User } from "../models/User";

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

  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    logger.info(`An admin account already exists (${existingAdmin.email}). Nothing to do.`);
    return;
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    existingEmail.role = "admin";
    existingEmail.isActive = true;
    existingEmail.isEmailVerified = true;
    await existingEmail.save();
    logger.info(`Promoted existing user ${email} to admin.`);
    return;
  }

  const admin = await User.create({
    name,
    email,
    password,
    role: "admin",
    isActive: true,
    isEmailVerified: true
  });

  logger.info(`Admin account created: ${admin.email}`);
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
