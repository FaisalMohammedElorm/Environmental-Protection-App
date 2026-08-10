import { seedAdmin } from "../../src/scripts/seedAdmin";
import { sql } from "../../src/config/db";
import { supabaseAdmin } from "../../src/config/supabaseAdmin";
import { createTestUser } from "../helpers";

const ORIGINAL_ENV = { ...process.env };

async function countAdmins(): Promise<number> {
  const rows = await sql<{ count: number }[]>`select count(*)::int as count from public.profiles where role = 'admin'`;
  return rows[0]!.count;
}

// seedAdmin()'s whole behavior branches on "does an admin already exist" —
// unlike other test files, these tests aren't independent of leftover state
// from earlier ones in the same run (setupAfterEnv.ts deliberately doesn't
// wipe profiles between tests, to avoid a Supabase Auth API call per test).
// Start every test from a clean slate here specifically.
beforeEach(async () => {
  const admins = await sql<{ id: string }[]>`select id from public.profiles where role = 'admin'`;
  await Promise.all(admins.map((a) => supabaseAdmin.auth.admin.deleteUser(a.id).catch(() => undefined)));
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("seedAdmin", () => {
  it("fails cleanly when required env vars are missing", async () => {
    delete process.env.ADMIN_NAME;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;

    await seedAdmin();

    expect(await countAdmins()).toBe(0);
  });

  it("rejects a password under 8 characters", async () => {
    process.env.ADMIN_NAME = "Admin";
    process.env.ADMIN_EMAIL = "seed-admin-short-pass@example.com";
    process.env.ADMIN_PASSWORD = "short";

    await seedAdmin();

    expect(await countAdmins()).toBe(0);
  });

  it("creates a new admin account when none exists", async () => {
    process.env.ADMIN_NAME = "Ama Owusu";
    process.env.ADMIN_EMAIL = "seed-admin-new@example.com";
    process.env.ADMIN_PASSWORD = "StrongPass1";

    await seedAdmin();

    const [admin] = await sql<{ role: string; is_active: boolean }[]>`
      select role, is_active from public.profiles where email = ${process.env.ADMIN_EMAIL}
    `;
    expect(admin?.role).toBe("admin");
    expect(admin?.is_active).toBe(true);

    const { data } = await supabaseAdmin.auth.admin.getUserById(
      (await sql<{ id: string }[]>`select id from public.profiles where email = ${process.env.ADMIN_EMAIL}`)[0]!.id
    );
    expect(data.user?.email_confirmed_at).toBeTruthy();

    await supabaseAdmin.auth.admin.deleteUser(data.user!.id);
  });

  it("is a no-op when an admin already exists", async () => {
    await createTestUser({ role: "admin", email: "seed-existing-admin@example.com" });

    process.env.ADMIN_NAME = "New Admin";
    process.env.ADMIN_EMAIL = "seed-admin-should-not-be-created@example.com";
    process.env.ADMIN_PASSWORD = "StrongPass1";

    await seedAdmin();

    expect(await countAdmins()).toBe(1);
    const newUser = await sql`select id from public.profiles where email = ${process.env.ADMIN_EMAIL}`;
    expect(newUser).toHaveLength(0);
  });

  it("promotes an existing (non-admin) user with the target email instead of erroring on the duplicate", async () => {
    const futureAdmin = await createTestUser({ role: "citizen", email: "seed-future-admin@example.com" });

    process.env.ADMIN_NAME = "Future Admin";
    process.env.ADMIN_EMAIL = futureAdmin.email;
    process.env.ADMIN_PASSWORD = "StrongPass1";

    await seedAdmin();

    const [promoted] = await sql<{ role: string }[]>`select role from public.profiles where id = ${futureAdmin.id}`;
    expect(promoted?.role).toBe("admin");
  });
});
