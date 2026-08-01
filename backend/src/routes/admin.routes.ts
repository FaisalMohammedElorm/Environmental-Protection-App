import { Router } from "express";
import {
  listUsersHandler,
  setUserActiveHandler,
  setUserRoleHandler,
  listAuditLogsHandler,
  getSettingsHandler,
  updateSettingsHandler
} from "../controllers/admin.controller";
import { protect, restrictTo } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import {
  listUsersQuerySchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  userIdParamSchema,
  updateSettingsSchema
} from "../validators/admin.validator";

const router = Router();

router.use(protect, restrictTo("admin"));

router.get("/users", validateRequest({ query: listUsersQuerySchema }), listUsersHandler);
router.patch(
  "/users/:id/status",
  validateRequest({ params: userIdParamSchema, body: updateUserStatusSchema }),
  setUserActiveHandler
);
router.patch(
  "/users/:id/role",
  validateRequest({ params: userIdParamSchema, body: updateUserRoleSchema }),
  setUserRoleHandler
);

router.get("/audit-logs", listAuditLogsHandler);

router.get("/settings", getSettingsHandler);
router.put("/settings", validateRequest({ body: updateSettingsSchema }), updateSettingsHandler);

export default router;
