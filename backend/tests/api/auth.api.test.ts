import request from "supertest";
import { createApp } from "../../src/app";
import { createTestUser, authHeader } from "../helpers";

const app = createApp();

describe("Auth API", () => {
  describe("POST /api/v1/auth/register", () => {
    it("registers a new user and returns an access token", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Ama Owusu",
        email: "ama-api@example.com",
        password: "StrongPass1"
      });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe("ama-api@example.com");
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.headers["set-cookie"]?.[0]).toContain("refreshToken=");
    });

    it("rejects a weak password with a 400 and field-level errors", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Weak Password",
        email: "weak@example.com",
        password: "weak"
      });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("logs in with correct credentials", async () => {
      await request(app).post("/api/v1/auth/register").send({
        name: "Login User",
        email: "login@example.com",
        password: "StrongPass1"
      });

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "login@example.com",
        password: "StrongPass1"
      });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it("returns 401 for incorrect credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "nonexistent@example.com",
        password: "StrongPass1"
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("returns 401 without a token", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns the current user with a valid token", async () => {
      const user = await createTestUser({ email: "me@example.com" });

      const res = await request(app).get("/api/v1/auth/me").set(authHeader(user));

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("me@example.com");
    });
  });
});
