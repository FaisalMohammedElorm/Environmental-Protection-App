import { Router } from "express";
import { getAnalyticsSummaryHandler } from "../controllers/admin.controller";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.get("/summary", protect, restrictTo("officer", "admin"), getAnalyticsSummaryHandler);

export default router;
