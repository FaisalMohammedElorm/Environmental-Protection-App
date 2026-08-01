import { Router } from "express";
import {
  listNotificationsHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler
} from "../controllers/notification.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);

router.get("/", listNotificationsHandler);
router.patch("/:id/read", markNotificationReadHandler);
router.post("/read-all", markAllNotificationsReadHandler);

export default router;
