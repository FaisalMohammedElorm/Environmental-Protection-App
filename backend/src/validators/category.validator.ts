import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2, "Name is required").max(60),
  description: z.string().max(300).optional()
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(300).optional(),
  isActive: z.boolean().optional()
});

export const categoryIdParamSchema = z.object({
  id: z.string().min(1)
});
