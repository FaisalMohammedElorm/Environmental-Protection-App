import { seedAdmin } from "../../src/scripts/seedAdmin";
import { User } from "../../src/models/User";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("seedAdmin", () => {
  it("fails cleanly when required env vars are missing", async () => {
    delete process.env.ADMIN_NAME;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;

    await seedAdmin();

    const adminCount = await User.countDocuments({ role: "admin" });
    expect(adminCount).toBe(0);
  });

  it("rejects a password under 8 characters", async () => {
    process.env.ADMIN_NAME = "Admin";
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.ADMIN_PASSWORD = "short";

    await seedAdmin();

    const adminCount = await User.countDocuments({ role: "admin" });
    expect(adminCount).toBe(0);
  });

  it("creates a new admin account when none exists", async () => {
    process.env.ADMIN_NAME = "Ama Owusu";
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.ADMIN_PASSWORD = "StrongPass1";

    await seedAdmin();

    const admin = await User.findOne({ email: "admin@example.com" });
    expect(admin?.role).toBe("admin");
    expect(admin?.isActive).toBe(true);
    expect(admin?.isEmailVerified).toBe(true);
  });

  it("is a no-op when an admin already exists", async () => {
    await User.create({
      name: "Existing Admin",
      email: "existing-admin@example.com",
      password: "StrongPass1",
      role: "admin"
    });

    process.env.ADMIN_NAME = "New Admin";
    process.env.ADMIN_EMAIL = "new-admin@example.com";
    process.env.ADMIN_PASSWORD = "StrongPass1";

    await seedAdmin();

    const adminCount = await User.countDocuments({ role: "admin" });
    expect(adminCount).toBe(1);
    const newUser = await User.findOne({ email: "new-admin@example.com" });
    expect(newUser).toBeNull();
  });

  it("promotes an existing (non-admin) user with the target email instead of erroring on the duplicate", async () => {
    await User.create({
      name: "Future Admin",
      email: "future-admin@example.com",
      password: "StrongPass1",
      role: "citizen"
    });

    process.env.ADMIN_NAME = "Future Admin";
    process.env.ADMIN_EMAIL = "future-admin@example.com";
    process.env.ADMIN_PASSWORD = "StrongPass1";

    await seedAdmin();

    const promoted = await User.findOne({ email: "future-admin@example.com" });
    expect(promoted?.role).toBe("admin");
  });
});
