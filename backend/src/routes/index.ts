import { Router } from "express";
import { sql } from "../config/db";
import reportRoutes from "./report.routes";
import categoryRoutes from "./category.routes";
import notificationRoutes from "./notification.routes";
import userRoutes from "./user.routes";
import adminRoutes from "./admin.routes";
import analyticsRoutes from "./analytics.routes";
import contactRoutes from "./contact.routes";

const router = Router();

router.get("/health", async (req, res) => {
  try {
    await sql`select 1`;
    res.status(200).json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded", database: "disconnected", timestamp: new Date().toISOString() });
  }
});

router.use("/reports", reportRoutes);
router.use("/categories", categoryRoutes);
router.use("/notifications", notificationRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/contact", contactRoutes);

export const apiRouter = router;
