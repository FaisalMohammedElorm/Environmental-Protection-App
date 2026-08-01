jest.mock("../../src/services/upload.service", () => ({
  ...jest.requireActual("../../src/services/upload.service"),
  uploadImageBuffer: jest.fn().mockResolvedValue("https://res.cloudinary.com/demo/image/upload/v1/ecoalert/avatars/mock.jpg")
}));

import request from "supertest";
import { createApp } from "../../src/app";
import { createTestUser, authHeader } from "../helpers";

const app = createApp();

describe("Avatar upload API", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/v1/users/me/avatar");
    expect(res.status).toBe(401);
  });

  it("rejects a request with no file", async () => {
    const user = await createTestUser({ role: "citizen" });
    const res = await request(app).post("/api/v1/users/me/avatar").set(authHeader(user));
    expect(res.status).toBe(400);
  });

  it("rejects a file that isn't a real image (bad magic bytes)", async () => {
    const user = await createTestUser({ role: "citizen" });
    const res = await request(app)
      .post("/api/v1/users/me/avatar")
      .set(authHeader(user))
      .attach("avatar", Buffer.from("not a real image"), {
        filename: "fake.jpg",
        contentType: "image/jpeg"
      });
    expect(res.status).toBe(400);
  });

  it("uploads a valid image and sets avatarUrl", async () => {
    const user = await createTestUser({ role: "citizen" });
    const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

    const res = await request(app)
      .post("/api/v1/users/me/avatar")
      .set(authHeader(user))
      .attach("avatar", jpegBytes, { filename: "photo.jpg", contentType: "image/jpeg" });

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toContain("res.cloudinary.com");
  });
});
