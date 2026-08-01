import { Router } from "express";
import authRoutes from "./auth.routes";
import reportRoutes from "./report.routes";
import categoryRoutes from "./category.routes";
import notificationRoutes from "./notification.routes";
import userRoutes from "./user.routes";
import adminRoutes from "./admin.routes";
import analyticsRoutes from "./analytics.routes";
import contactRoutes from "./contact.routes";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/reports", reportRoutes);
router.use("/categories", categoryRoutes);
router.use("/notifications", notificationRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/contact", contactRoutes);

export const apiRouter = router;
