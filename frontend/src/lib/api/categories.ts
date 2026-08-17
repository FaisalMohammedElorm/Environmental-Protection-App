import { supabase } from "@/lib/supabase/client";
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from "@/types/category";

const CATEGORY_SELECT = "id, name, slug, description, is_active, reports(count)";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  reports: Array<{ count: number }>;
}

function serialize(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    isActive: row.is_active,
    reportCount: row.reports?.[0]?.count ?? 0
  };
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select(CATEGORY_SELECT).order("name");
  if (error) throw error;
  return ((data ?? []) as unknown as CategoryRow[]).map(serialize);
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: payload.name, description: payload.description ?? null })
    .select(CATEGORY_SELECT)
    .single();
  if (error || !data) throw error ?? new Error("Could not create category");
  return serialize(data as unknown as CategoryRow);
}

export async function updateCategory(id: string, payload: UpdateCategoryPayload): Promise<Category> {
  const update: Record<string, unknown> = {};
  if (payload.name !== undefined) update.name = payload.name;
  if (payload.description !== undefined) update.description = payload.description;
  if (payload.isActive !== undefined) update.is_active = payload.isActive;

  const { data, error } = await supabase.from("categories").update(update).eq("id", id).select(CATEGORY_SELECT).single();
  if (error || !data) throw error ?? new Error("Could not update category");
  return serialize(data as unknown as CategoryRow);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
