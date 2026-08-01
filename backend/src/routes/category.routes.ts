import { Router } from "express";
import {
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler
} from "../controllers/category.controller";
import { protect, restrictTo } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import { createCategorySchema, updateCategorySchema, categoryIdParamSchema } from "../validators/category.validator";

const router = Router();

router.get("/", listCategoriesHandler);

router.use(protect, restrictTo("admin"));

router.post("/", validateRequest({ body: createCategorySchema }), createCategoryHandler);
router.patch(
  "/:id",
  validateRequest({ params: categoryIdParamSchema, body: updateCategorySchema }),
  updateCategoryHandler
);
router.delete("/:id", validateRequest({ params: categoryIdParamSchema }), deleteCategoryHandler);

export default router;
