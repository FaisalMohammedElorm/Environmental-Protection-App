import type { ICategory } from "../../models/Category";

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  reportCount: number;
}

export function serializeCategory(category: ICategory, reportCount = 0): PublicCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    isActive: category.isActive,
    reportCount
  };
}
