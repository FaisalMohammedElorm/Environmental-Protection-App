import request from "supertest";
import { createApp } from "../../src/app";
import { createTestUser, authHeader } from "../helpers";
import { createNotification } from "../../src/services/notification.service";

const app = createApp();

describe("Notifications API", () => {
  it("lists only the current user's notifications, newest first", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    const otherCitizen = await createTestUser({ role: "citizen" });

    await createNotification({ user: citizen.id, type: "system", title: "First", body: "Body one" });
    await createNotification({ user: citizen.id, type: "system", title: "Second", body: "Body two" });
    await createNotification({ user: otherCitizen.id, type: "system", title: "Not yours", body: "Body three" });

    const res = await request(app).get("/api/v1/notifications").set(authHeader(citizen));

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0].title).toBe("Second");
  });

  it("marks a single notification as read", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    await createNotification({ user: citizen.id, type: "system", title: "Unread", body: "Body" });

    const list = await request(app).get("/api/v1/notifications").set(authHeader(citizen));
    const notificationId = list.body.items[0].id;

    const res = await request(app)
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set(authHeader(citizen));

    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);
  });

  it("marks all notifications as read", async () => {
    const citizen = await createTestUser({ role: "citizen" });
    await createNotification({ user: citizen.id, type: "system", title: "A", body: "Body" });
    await createNotification({ user: citizen.id, type: "system", title: "B", body: "Body" });

    const res = await request(app).post("/api/v1/notifications/read-all").set(authHeader(citizen));
    expect(res.status).toBe(200);

    const list = await request(app).get("/api/v1/notifications").set(authHeader(citizen));
    expect(list.body.items.every((n: { isRead: boolean }) => n.isRead)).toBe(true);
  });
});
