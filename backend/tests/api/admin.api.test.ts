import request from "supertest";
import { createApp } from "../../src/app";
import { createTestUser, authHeader } from "../helpers";

const app = createApp();

describe("Admin API", () => {
  it("forbids non-admins from listing users", async () => {
    const officer = await createTestUser({ role: "officer" });
    const res = await request(app).get("/api/v1/admin/users").set(authHeader(officer));
    expect(res.status).toBe(403);
  });

  it("allows an admin to list, suspend, and change a user's role", async () => {
    const admin = await createTestUser({ role: "admin" });
    const citizen = await createTestUser({ role: "citizen" });

    const list = await request(app).get("/api/v1/admin/users").set(authHeader(admin));
    expect(list.status).toBe(200);
    expect(list.body.total).toBeGreaterThanOrEqual(2);

    const suspend = await request(app)
      .patch(`/api/v1/admin/users/${citizen.id}/status`)
      .set(authHeader(admin))
      .send({ isActive: false });
    expect(suspend.status).toBe(200);
    expect(suspend.body.isActive).toBe(false);

    const promote = await request(app)
      .patch(`/api/v1/admin/users/${citizen.id}/role`)
      .set(authHeader(admin))
      .send({ role: "officer" });
    expect(promote.status).toBe(200);
    expect(promote.body.role).toBe("officer");
  });

  it("returns an analytics summary for officers and admins, but not citizens", async () => {
    const admin = await createTestUser({ role: "admin" });
    const citizen = await createTestUser({ role: "citizen" });

    const adminRes = await request(app).get("/api/v1/analytics/summary").set(authHeader(admin));
    expect(adminRes.status).toBe(200);
    expect(adminRes.body).toHaveProperty("totalReports");

    const citizenRes = await request(app).get("/api/v1/analytics/summary").set(authHeader(citizen));
    expect(citizenRes.status).toBe(403);
  });

  it("gets and updates system settings", async () => {
    const admin = await createTestUser({ role: "admin" });

    const getRes = await request(app).get("/api/v1/admin/settings").set(authHeader(admin));
    expect(getRes.status).toBe(200);
    expect(getRes.body.siteName).toBe("EcoAlert");

    const putRes = await request(app)
      .put("/api/v1/admin/settings")
      .set(authHeader(admin))
      .send({
        siteName: "EcoAlert Ghana",
        supportEmail: "support@ecoalert.app",
        autoAssignReports: true,
        reportResolutionSlaHours: 48,
        allowPublicReportSubmission: true
      });

    expect(putRes.status).toBe(200);
    expect(putRes.body.siteName).toBe("EcoAlert Ghana");
  });
});
