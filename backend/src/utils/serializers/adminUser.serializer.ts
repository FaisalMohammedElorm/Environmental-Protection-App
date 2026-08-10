export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  reports_filed?: number | string | null;
  reports_resolved?: number | string | null;
}

export interface PublicAdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  reportsFiled?: number;
  reportsResolved?: number;
  createdAt: string;
}

export function serializeAdminUser(row: AdminUserRow): PublicAdminUser {
  const hasStats = row.reports_filed !== undefined && row.reports_filed !== null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    reportsFiled: hasStats ? Number(row.reports_filed) : undefined,
    reportsResolved: hasStats ? Number(row.reports_resolved ?? 0) : undefined,
    createdAt: row.created_at.toISOString()
  };
}
