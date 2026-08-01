import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as categoryService from "../services/category.service";
import * as auditLogService from "../services/auditLog.service";

export const listCategoriesHandler = catchAsync(async (req: Request, res: Response) => {
  const categories = await categoryService.listCategories();
  res.status(200).json(categories);
});

export const createCategoryHandler = catchAsync(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);

  await auditLogService.recordAuditLog({
    actor: req.user!,
    action: "create_category",
    targetType: "Category",
    targetId: category.id
  });

  res.status(201).json(category);
});

export const updateCategoryHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const category = await categoryService.updateCategory(id, req.body);

  await auditLogService.recordAuditLog({
    actor: req.user!,
    action: "update_category",
    targetType: "Category",
    targetId: id
  });

  res.status(200).json(category);
});

export const deleteCategoryHandler = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await categoryService.deleteCategory(id);

  await auditLogService.recordAuditLog({
    actor: req.user!,
    action: "delete_category",
    targetType: "Category",
    targetId: id
  });

  res.status(204).send();
});
