import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

function extractCookie(setCookieHeader: string[] | undefined, name: string): string | undefined {
  const raw = setCookieHeader?.find((c) => c.startsWith(`${name}=`));
  return raw?.split(";")[0]?.split("=")[1];
}

async function registerAndGetCookies() {
  const res = await request(app).post("/api/v1/auth/register").send({
    name: "Csrf Test",
    email: `csrf-${Date.now()}@example.com`,
    password: "StrongPass1"
  });

  const setCookie = res.headers["set-cookie"] as unknown as string[] | undefined;
  const refreshToken = extractCookie(setCookie, "refreshToken");
  const csrfToken = extractCookie(setCookie, "csrfToken");

  return { refreshToken, csrfToken };
}

describe("CSRF protection", () => {
  it("rejects refresh-token with no CSRF cookie or header at all", async () => {
    const res = await request(app).post("/api/v1/auth/refresh-token");
    expect(res.status).toBe(403);
  });

  it("rejects refresh-token when the header doesn't match the cookie", async () => {
    const { refreshToken, csrfToken } = await registerAndGetCookies();
    expect(csrfToken).toBeDefined();

    const res = await request(app)
      .post("/api/v1/auth/refresh-token")
      .set("Cookie", [`refreshToken=${refreshToken}`, `csrfToken=${csrfToken}`])
      .set("X-CSRF-Token", "a-completely-different-value");

    expect(res.status).toBe(403);
  });

  it("rejects refresh-token when only the cookie is sent (the classic CSRF scenario)", async () => {
    const { refreshToken, csrfToken } = await registerAndGetCookies();

    // Simulates a cross-site request: the browser attaches cookies automatically, but a
    // malicious third-party page has no way to read csrfToken to also send as a header.
    const res = await request(app)
      .post("/api/v1/auth/refresh-token")
      .set("Cookie", [`refreshToken=${refreshToken}`, `csrfToken=${csrfToken}`]);

    expect(res.status).toBe(403);
  });

  it("succeeds when the header matches the cookie", async () => {
    const { refreshToken, csrfToken } = await registerAndGetCookies();
    expect(refreshToken).toBeDefined();
    expect(csrfToken).toBeDefined();

    const res = await request(app)
      .post("/api/v1/auth/refresh-token")
      .set("Cookie", [`refreshToken=${refreshToken}`, `csrfToken=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken!);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it("rejects logout without a matching CSRF header", async () => {
    const { refreshToken, csrfToken } = await registerAndGetCookies();

    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", [`refreshToken=${refreshToken}`, `csrfToken=${csrfToken}`]);

    expect(res.status).toBe(403);
  });

  it("succeeds on logout with a matching CSRF header", async () => {
    const { refreshToken, csrfToken } = await registerAndGetCookies();

    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", [`refreshToken=${refreshToken}`, `csrfToken=${csrfToken}`])
      .set("X-CSRF-Token", csrfToken!);

    expect(res.status).toBe(200);
  });
});
