export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  report_count?: number | string | null;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  reportCount: number;
}

export function serializeCategory(row: CategoryRow): PublicCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    isActive: row.is_active,
    reportCount: Number(row.report_count ?? 0)
  };
}
