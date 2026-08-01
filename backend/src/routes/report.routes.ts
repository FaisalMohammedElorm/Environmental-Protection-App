import { Router } from "express";
import {
  createReportHandler,
  listReportsHandler,
  listMyReportsHandler,
  getReportHandler,
  updateReportHandler,
  updateReportStatusHandler,
  assignReportHandler,
  deleteReportHandler,
  addCommentHandler
} from "../controllers/report.controller";
import { protect, restrictTo } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import { uploadReportImages, validateImageSignatures } from "../middleware/upload";
import {
  createReportSchema,
  listReportsQuerySchema,
  updateReportSchema,
  updateStatusSchema,
  assignReportSchema,
  addCommentSchema,
  reportIdParamSchema
} from "../validators/report.validator";

const router = Router();

router.use(protect);

router.get("/", restrictTo("officer", "admin"), validateRequest({ query: listReportsQuerySchema }), listReportsHandler);
router.get("/mine", validateRequest({ query: listReportsQuerySchema }), listMyReportsHandler);

router.post(
  "/",
  uploadReportImages,
  validateImageSignatures,
  validateRequest({ body: createReportSchema }),
  createReportHandler
);

router.get("/:id", validateRequest({ params: reportIdParamSchema }), getReportHandler);
router.patch(
  "/:id",
  validateRequest({ params: reportIdParamSchema, body: updateReportSchema }),
  updateReportHandler
);
router.delete("/:id", validateRequest({ params: reportIdParamSchema }), deleteReportHandler);

router.patch(
  "/:id/status",
  restrictTo("officer", "admin"),
  validateRequest({ params: reportIdParamSchema, body: updateStatusSchema }),
  updateReportStatusHandler
);
router.patch(
  "/:id/assign",
  restrictTo("officer", "admin"),
  validateRequest({ params: reportIdParamSchema, body: assignReportSchema }),
  assignReportHandler
);

router.post(
  "/:id/comments",
  validateRequest({ params: reportIdParamSchema, body: addCommentSchema }),
  addCommentHandler
);

export default router;
