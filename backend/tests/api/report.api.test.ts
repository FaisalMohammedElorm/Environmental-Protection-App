import request from "supertest";
import { createApp } from "../../src/app";
import { createTestUser, authHeader } from "../helpers";
import { Notification } from "../../src/models/Notification";

const app = createApp();

async function createReportAs(userHeader: { Authorization: string }) {
  return request(app)
    .post("/api/v1/reports")
    .set(userHeader)
    .field("category", "blocked_drain")
    .field("severity", "moderate")
    .field("description", "Drain has been blocked for two weeks near the market")
    .field("address", "Market Street")
    .field("latitude", "5.6")
    .field("longitude", "-0.2");
}

describe("Reports API", () => {
  it("requires authentication to create a report", async () => {
    const res = await request(app).post("/api/v1/reports").field("category", "flooding");
    expect(res.status).toBe(401);
  });

  it("lets an authenticated citizen create a report without images", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    const res = await createReportAs(authHeader(citizen));

    expect(res.status).toBe(201);
    expect(res.body.category).toBe("blocked_drain");
    expect(res.body.status).toBe("new");
    expect(res.body.reportedBy.id).toBe(citizen.id);
  });

  it("rejects an invalid category with a 400", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    const res = await request(app)
      .post("/api/v1/reports")
      .set(authHeader(citizen))
      .field("category", "not_a_real_category")
      .field("severity", "moderate")
      .field("description", "Some description that is long enough")
      .field("address", "Somewhere")
      .field("latitude", "5.6")
      .field("longitude", "-0.2");

    expect(res.status).toBe(400);
  });

  it("forbids citizens from listing all reports", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    const res = await request(app).get("/api/v1/reports").set(authHeader(citizen));
    expect(res.status).toBe(403);
  });

  it("allows officers to list all reports", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    const officer = await createTestUser({ role: "officer" });
    await createReportAs(authHeader(citizen));

    const res = await request(app).get("/api/v1/reports").set(authHeader(officer));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it("scopes /reports/mine to the requesting citizen", async () => {
    const citizenA = await createTestUser({ role: "citizen" });
    const citizenB = await createTestUser({ role: "citizen" });
    await createReportAs(authHeader(citizenA));
    await createReportAs(authHeader(citizenB));

    const res = await request(app).get("/api/v1/reports/mine").set(authHeader(citizenA));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });

  it("forbids a citizen from changing report status", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    const created = await createReportAs(authHeader(citizen));

    const res = await request(app)
      .patch(`/api/v1/reports/${created.body.id}/status`)
      .set(authHeader(citizen))
      .send({ status: "resolved" });

    expect(res.status).toBe(403);
  });

  it("allows an officer to update status and notifies the reporter", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    const officer = await createTestUser({ role: "officer" });
    const created = await createReportAs(authHeader(citizen));

    const res = await request(app)
      .patch(`/api/v1/reports/${created.body.id}/status`)
      .set(authHeader(officer))
      .send({ status: "under_review" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("under_review");

    const notifications = await Notification.find({ user: citizen.id });
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.type).toBe("report_status_changed");
  });

  it("allows comments and reflects them on the report", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    const officer = await createTestUser({ role: "officer" });
    const created = await createReportAs(authHeader(citizen));

    const res = await request(app)
      .post(`/api/v1/reports/${created.body.id}/comments`)
      .set(authHeader(officer))
      .send({ body: "Team dispatched, ETA 2 hours." });

    expect(res.status).toBe(201);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].authorRole).toBe("officer");
  });

  it("prevents deleting another citizen's report", async () => {
    const citizenA = await createTestUser({ role: "citizen" });
    const citizenB = await createTestUser({ role: "citizen" });
    const created = await createReportAs(authHeader(citizenA));

    const res = await request(app)
      .delete(`/api/v1/reports/${created.body.id}`)
      .set(authHeader(citizenB));

    expect(res.status).toBe(403);
  });

  it("returns 404 (not 200) when a citizen tries to view another citizen's report by ID", async () => {
    const citizenA = await createTestUser({ role: "citizen" });
    const citizenB = await createTestUser({ role: "citizen" });
    const created = await createReportAs(authHeader(citizenA));

    const res = await request(app).get(`/api/v1/reports/${created.body.id}`).set(authHeader(citizenB));
    expect(res.status).toBe(404);
  });

  it("lets the owner view their own report by ID", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    const created = await createReportAs(authHeader(citizen));

    const res = await request(app).get(`/api/v1/reports/${created.body.id}`).set(authHeader(citizen));
    expect(res.status).toBe(200);
  });

  it("lets an officer view any citizen's report by ID", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    const officer = await createTestUser({ role: "officer" });
    const created = await createReportAs(authHeader(citizen));

    const res = await request(app).get(`/api/v1/reports/${created.body.id}`).set(authHeader(officer));
    expect(res.status).toBe(200);
  });
});
