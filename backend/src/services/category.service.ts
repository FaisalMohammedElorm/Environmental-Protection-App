import { Category, type ICategory } from "../models/Category";
import { Report } from "../models/Report";
import { ApiError } from "../utils/ApiError";
import { serializeCategory, type PublicCategory } from "../utils/serializers/category.serializer";
import { DEFAULT_CATEGORIES } from "../types/enums";
import { logger } from "../config/logger";

export async function listCategories(): Promise<PublicCategory[]> {
  const categories = await Category.find().sort({ name: 1 });

  // Single aggregation for all report counts, instead of one query per category.
  const counts = await Report.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);
  const countsBySlug = new Map(counts.map((row) => [row._id, row.count]));

  return categories.map((category) => serializeCategory(category, countsBySlug.get(category.slug) ?? 0));
}

/**
 * Seeds the original 11 default categories on first boot, so report submission has
 * something to select from out of the box. Safe to call on every startup — it only
 * inserts categories that don't already exist (matched by name) and never overwrites
 * or reactivates ones an admin has since edited or deactivated.
 */
export async function ensureDefaultCategories(): Promise<void> {
  const existingNames = new Set((await Category.find().select("name")).map((c) => c.name));
  const missing = DEFAULT_CATEGORIES.filter((name) => !existingNames.has(name));

  if (missing.length === 0) return;

  await Category.insertMany(missing.map((name) => ({ name })));
  logger.info(`Seeded ${missing.length} default categories`);
}

export async function createCategory(input: { name: string; description?: string }): Promise<PublicCategory> {
  const existing = await Category.findOne({ name: input.name });
  if (existing) throw ApiError.conflict("A category with that name already exists");

  const category = await Category.create(input);
  return serializeCategory(category);
}

async function findCategoryOrThrow(id: string): Promise<ICategory> {
  const category = await Category.findById(id);
  if (!category) throw ApiError.notFound("Category not found");
  return category;
}

export async function updateCategory(
  id: string,
  updates: { name?: string; description?: string; isActive?: boolean }
): Promise<PublicCategory> {
  const category = await findCategoryOrThrow(id);

  if (updates.name !== undefined) category.name = updates.name;
  if (updates.description !== undefined) category.description = updates.description;
  if (updates.isActive !== undefined) category.isActive = updates.isActive;

  await category.save();
  const reportCount = await Report.countDocuments({ category: category.slug });
  return serializeCategory(category, reportCount);
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await findCategoryOrThrow(id);
  await category.deleteOne();
}
