import { sql } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { paginate, type Paginated } from "../utils/apiResponse";
import { serializeAdminUser, type PublicAdminUser, type AdminUserRow } from "../utils/serializers/adminUser.serializer";
import type { UserRole } from "../types/enums";

interface ListUsersFilters {
  role?: UserRole;
  search?: string;
  page: number;
  limit: number;
}

function userFilters(filters: ListUsersFilters) {
  return sql`
    where 1=1
    ${filters.role ? sql`and role = ${filters.role}` : sql``}
    ${filters.search ? sql`and search @@ plainto_tsquery('english', ${filters.search})` : sql``}
  `;
}

export async function listUsers(filters: ListUsersFilters): Promise<Paginated<PublicAdminUser>> {
  const offset = (filters.page - 1) * filters.limit;

  const [rows, countRows] = await Promise.all([
    sql<AdminUserRow[]>`
      select
        p.id, p.name, p.email, p.role, p.is_active, p.created_at,
        (select count(*) from public.reports r where r.reported_by = p.id) as reports_filed,
        (select count(*) from public.reports r where r.assigned_to = p.id and r.status = 'resolved') as reports_resolved
      from public.profiles p
      ${userFilters(filters)}
      order by p.created_at desc
      limit ${filters.limit} offset ${offset}
    `,
    sql<{ count: number }[]>`select count(*)::int as count from public.profiles p ${userFilters(filters)}`
  ]);

  // Only officers get filed/resolved stats surfaced, matching the old behavior.
  const items = rows.map((row) =>
    serializeAdminUser(row.role === "officer" ? row : { ...row, reports_filed: null, reports_resolved: null })
  );

  return paginate(items, countRows[0]!.count, filters.page, filters.limit);
}

export async function setUserActive(id: string, isActive: boolean): Promise<PublicAdminUser> {
  const [row] = await sql<AdminUserRow[]>`
    update public.profiles set is_active = ${isActive} where id = ${id}
    returning id, name, email, role, is_active, created_at
  `;
  if (!row) throw ApiError.notFound("User not found");
  return serializeAdminUser(row);
}

export async function setUserRole(id: string, role: UserRole): Promise<PublicAdminUser> {
  const [row] = await sql<AdminUserRow[]>`
    update public.profiles set role = ${role} where id = ${id}
    returning id, name, email, role, is_active, created_at
  `;
  if (!row) throw ApiError.notFound("User not found");
  return serializeAdminUser(row);
}

export interface AnalyticsSummary {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  totalUsers: number;
  categoryDistribution: Array<{ category: string; count: number }>;
  monthlyTrends: Array<{ month: string; reports: number; resolved: number }>;
  officerPerformance: Array<{ officerName: string; resolved: number; avgResponseHours: number }>;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [
    totalReportsRows,
    resolvedReportsRows,
    totalUsersRows,
    categoryRows,
    monthlyRows,
    officerRows
  ] = await Promise.all([
    sql<{ total_reports: number }[]>`select count(*)::int as total_reports from public.reports`,
    sql<{ resolved_reports: number }[]>`
      select count(*)::int as resolved_reports from public.reports where status = 'resolved'
    `,
    sql<{ total_users: number }[]>`select count(*)::int as total_users from public.profiles`,
    sql<{ category: string; count: number }[]>`
      select c.slug as category, count(*)::int as count
      from public.reports r
      join public.categories c on c.id = r.category_id
      group by c.slug
    `,
    sql<{ month: string; reports: number; resolved: number }[]>`
      select
        to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
        count(*)::int as reports,
        count(*) filter (where status = 'resolved')::int as resolved
      from public.reports
      group by 1
      order by 1
      limit 12
    `,
    sql<{ officer_name: string; resolved: number; avg_response_ms: number | null }[]>`
      select
        p.name as officer_name,
        count(*)::int as resolved,
        avg(extract(epoch from (r.resolved_at - r.created_at)) * 1000) as avg_response_ms
      from public.reports r
      join public.profiles p on p.id = r.assigned_to
      where r.assigned_to is not null and r.status = 'resolved'
      group by p.id, p.name
      order by resolved desc
      limit 10
    `
  ]);

  const totalReports = totalReportsRows[0]!.total_reports;
  const resolvedReports = resolvedReportsRows[0]!.resolved_reports;

  return {
    totalReports,
    resolvedReports,
    pendingReports: totalReports - resolvedReports,
    totalUsers: totalUsersRows[0]!.total_users,
    categoryDistribution: categoryRows,
    monthlyTrends: monthlyRows,
    officerPerformance: officerRows.map((row) => ({
      officerName: row.officer_name,
      resolved: row.resolved,
      avgResponseHours: Math.round((Number(row.avg_response_ms ?? 0) / (1000 * 60 * 60)) * 10) / 10
    }))
  };
}

export interface PublicAuditLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

interface AuditLogRow {
  id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, string> | null;
  created_at: Date;
}

export async function listAuditLogs(page: number, limit: number): Promise<Paginated<PublicAuditLog>> {
  const offset = (page - 1) * limit;

  const [rows, countRows] = await Promise.all([
    sql<AuditLogRow[]>`
      select id, actor_name, actor_role, action, target_type, target_id, metadata, created_at
      from public.audit_logs
      order by created_at desc
      limit ${limit} offset ${offset}
    `,
    sql<{ count: number }[]>`select count(*)::int as count from public.audit_logs`
  ]);

  const items = rows.map((row) => ({
    id: row.id,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at.toISOString()
  }));

  return paginate(items, countRows[0]!.count, page, limit);
}

export interface PublicSettings {
  siteName: string;
  supportEmail: string;
  autoAssignReports: boolean;
  reportResolutionSlaHours: number;
  allowPublicReportSubmission: boolean;
}

interface SettingsRow {
  site_name: string;
  support_email: string;
  auto_assign_reports: boolean;
  report_resolution_sla_hours: number;
  allow_public_report_submission: boolean;
}

function serializeSettings(row: SettingsRow): PublicSettings {
  return {
    siteName: row.site_name,
    supportEmail: row.support_email,
    autoAssignReports: row.auto_assign_reports,
    reportResolutionSlaHours: row.report_resolution_sla_hours,
    allowPublicReportSubmission: row.allow_public_report_submission
  };
}

async function getOrCreateSettingsRow(): Promise<SettingsRow> {
  const rows = await sql<SettingsRow[]>`select * from public.settings where id = true`;
  if (rows[0]) return rows[0];
  const created = await sql<SettingsRow[]>`insert into public.settings (id) values (true) returning *`;
  return created[0]!;
}

export async function getSystemSettings(): Promise<PublicSettings> {
  return serializeSettings(await getOrCreateSettingsRow());
}

export async function updateSystemSettings(updates: PublicSettings): Promise<PublicSettings> {
  await getOrCreateSettingsRow();
  const [row] = await sql<SettingsRow[]>`
    update public.settings
    set
      site_name = ${updates.siteName},
      support_email = ${updates.supportEmail},
      auto_assign_reports = ${updates.autoAssignReports},
      report_resolution_sla_hours = ${updates.reportResolutionSlaHours},
      allow_public_report_submission = ${updates.allowPublicReportSubmission}
    where id = true
    returning *
  `;
  return serializeSettings(row!);
}
