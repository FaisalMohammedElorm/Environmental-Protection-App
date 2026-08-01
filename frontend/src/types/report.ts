// Categories are managed by admins (see /admin/categories) and validated against the
// live Category collection on the backend — not a fixed union here. categoryLabels below
// covers the original defaults for a nicer label; formatCategoryLabel() falls back to
// humanizing the slug for any category an admin has added since.
export type ReportCategory = string;

export type ReportSeverity = "low" | "moderate" | "high" | "critical";

export type ReportStatus = "new" | "under_review" | "assigned" | "in_progress" | "resolved" | "rejected";

export interface ReportComment {
  id: string;
  authorName: string;
  authorRole: "citizen" | "officer" | "admin";
  body: string;
  createdAt: string;
}

export interface Report {
  id: string;
  category: ReportCategory;
  description: string;
  severity: ReportSeverity;
  status: ReportStatus;
  images: string[];
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  reportedBy: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
  comments: ReportComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportPayload {
  category: ReportCategory;
  description: string;
  severity: ReportSeverity;
  latitude: number;
  longitude: number;
  address: string;
  images: File[];
}

export interface ReportListParams {
  status?: ReportStatus;
  category?: ReportCategory;
  severity?: ReportSeverity;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "createdAt" | "severity" | "status";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const categoryLabels: Record<string, string> = {
  illegal_dumping: "Illegal dumping",
  overflowing_bin: "Overflowing bin",
  flooding: "Flooding",
  pollution: "Pollution",
  blocked_drain: "Blocked drain",
  bush_fire: "Bush fire",
  illegal_mining: "Illegal mining",
  water_pollution: "Water pollution",
  air_pollution: "Air pollution",
  tree_cutting: "Tree cutting",
  other: "Other hazard"
};

/**
 * Categories are admin-managed and not limited to the defaults above — this falls back to
 * humanizing the raw slug (e.g. "noise_pollution" -> "Noise pollution") for anything an
 * admin has added since, so new categories never render as a raw, un-humanized slug.
 */
export function formatCategoryLabel(category: string): string {
  if (categoryLabels[category]) return categoryLabels[category];
  const humanized = category.replace(/_/g, " ").trim();
  return humanized.charAt(0).toUpperCase() + humanized.slice(1);
}

export const statusLabels: Record<ReportStatus, string> = {
  new: "New",
  under_review: "Under review",
  assigned: "Assigned",
  in_progress: "In progress",
  resolved: "Resolved",
  rejected: "Rejected"
};
