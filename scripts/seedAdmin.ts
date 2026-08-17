/**
 * Creates the first admin account on a fresh deployment.
 *
 * Without this, there is no way to reach the admin dashboard at all — every
 * signup defaults to "citizen", and promoting someone to "admin" requires
 * an existing admin to change another user's role.
 *
 * Usage:
 *   ADMIN_NAME="Ama Owusu" ADMIN_EMAIL=admin@ecoalert.app ADMIN_PASSWORD=... npm run seed:admin
 *
 * Safe to re-run: if an admin account already exists, it does nothing.
 */
import dotenv from "dotenv";
dotenv.config();

import { sql } from "./db";
import { supabaseAdmin } from "./supabaseAdmin";

async function seedAdmin(): Promise<void> {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error("Missing required env vars. Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD before running this script.");
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const [existingAdmin] = await sql<{ email: string }[]>`
    select email from public.profiles where role = 'admin' limit 1
  `;
  if (existingAdmin) {
    console.log(`An admin account already exists (${existingAdmin.email}). Nothing to do.`);
    return;
  }

  const [existingProfile] = await sql<{ id: string }[]>`
    select id from public.profiles where email = ${email}
  `;
  if (existingProfile) {
    await sql`update public.profiles set role = 'admin', is_active = true where id = ${existingProfile.id}`;
    console.log(`Promoted existing user ${email} to admin.`);
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

  console.log(`Admin account created: ${email}`);
}

seedAdmin()
  .catch((error) => {
    console.error(`Failed to seed admin: ${(error as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => {
    void sql.end();
  });
