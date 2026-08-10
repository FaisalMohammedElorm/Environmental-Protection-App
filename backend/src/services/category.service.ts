import { sql } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { serializeCategory, type PublicCategory, type CategoryRow } from "../utils/serializers/category.serializer";
import { DEFAULT_CATEGORIES } from "../types/enums";
import { logger } from "../config/logger";

export async function listCategories(): Promise<PublicCategory[]> {
  const rows = await sql<CategoryRow[]>`
    select c.id, c.name, c.slug, c.description, c.is_active,
           count(r.id)::int as report_count
    from public.categories c
    left join public.reports r on r.category_id = c.id
    group by c.id
    order by c.name
  `;
  return rows.map(serializeCategory);
}

/**
 * Seeds the original 11 default categories, so report submission has
 * something to select from out of the box. Safe to call on every startup —
 * it only inserts categories that don't already exist (matched by name) and
 * never overwrites or reactivates ones an admin has since edited or
 * deactivated. The 0010 migration already seeds these once; this is a
 * defensive fallback for a schema that was applied without seed data.
 */
export async function ensureDefaultCategories(): Promise<void> {
  const inserted = await sql<{ name: string }[]>`
    insert into public.categories (name)
    select unnest(${DEFAULT_CATEGORIES}::text[])
    on conflict (name) do nothing
    returning name
  `;

  if (inserted.length > 0) {
    logger.info(`Seeded ${inserted.length} default categories`);
  }
}

export async function createCategory(input: { name: string; description?: string }): Promise<PublicCategory> {
  const existing = await sql`select id from public.categories where name = ${input.name}`;
  if (existing.length > 0) throw ApiError.conflict("A category with that name already exists");

  const [row] = await sql<CategoryRow[]>`
    insert into public.categories (name, description)
    values (${input.name}, ${input.description ?? null})
    returning id, name, slug, description, is_active
  `;
  return serializeCategory({ ...row!, report_count: 0 });
}

async function findCategoryOrThrow(id: string): Promise<CategoryRow> {
  const [row] = await sql<CategoryRow[]>`
    select id, name, slug, description, is_active from public.categories where id = ${id}
  `;
  if (!row) throw ApiError.notFound("Category not found");
  return row;
}

export async function updateCategory(
  id: string,
  updates: { name?: string; description?: string; isActive?: boolean }
): Promise<PublicCategory> {
  const current = await findCategoryOrThrow(id);

  const name = updates.name ?? current.name;
  const description = updates.description !== undefined ? updates.description : current.description;
  const isActive = updates.isActive ?? current.is_active;

  const [row] = await sql<CategoryRow[]>`
    update public.categories
    set name = ${name}, description = ${description}, is_active = ${isActive}
    where id = ${id}
    returning id, name, slug, description, is_active
  `;

  const countRows = await sql<{ count: number }[]>`
    select count(*)::int as count from public.reports where category_id = ${id}
  `;

  return serializeCategory({ ...row!, report_count: countRows[0]!.count });
}

export async function deleteCategory(id: string): Promise<void> {
  await findCategoryOrThrow(id);
  // reports.category_id is ON DELETE RESTRICT — deleting a category still in
  // use throws a foreign_key_violation, mapped by errorHandler.ts to a 409.
  await sql`delete from public.categories where id = ${id}`;
}
