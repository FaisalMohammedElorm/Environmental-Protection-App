import request from "supertest";
import { createApp } from "../../src/app";
import { createTestUser, authHeader } from "../helpers";

const app = createApp();

describe("Categories API", () => {
  it("lists categories without authentication", async () => {
    const res = await request(app).get("/api/v1/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("forbids a citizen from creating a category", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    const res = await request(app)
      .post("/api/v1/categories")
      .set(authHeader(citizen))
      .send({ name: "Noise pollution" });

    expect(res.status).toBe(403);
  });

  it("allows an admin to create, update, and delete a category", async () => {
    const admin = await createTestUser({ role: "admin" });

    const created = await request(app)
      .post("/api/v1/categories")
      .set(authHeader(admin))
      .send({ name: "Noise pollution", description: "Excessive construction or industrial noise" });

    expect(created.status).toBe(201);
    expect(created.body.slug).toBe("noise_pollution");

    const updated = await request(app)
      .patch(`/api/v1/categories/${created.body.id}`)
      .set(authHeader(admin))
      .send({ isActive: false });

    expect(updated.status).toBe(200);
    expect(updated.body.isActive).toBe(false);

    const deleted = await request(app)
      .delete(`/api/v1/categories/${created.body.id}`)
      .set(authHeader(admin));

    expect(deleted.status).toBe(204);
  });

  it("rejects a duplicate category name", async () => {
    const admin = await createTestUser({ role: "admin" });
    await request(app).post("/api/v1/categories").set(authHeader(admin)).send({ name: "Dust pollution" });

    const res = await request(app)
      .post("/api/v1/categories")
      .set(authHeader(admin))
      .send({ name: "Dust pollution" });

    expect(res.status).toBe(409);
  });
});
