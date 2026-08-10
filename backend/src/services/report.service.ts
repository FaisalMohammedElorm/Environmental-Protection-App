import { sql } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { paginate, type Paginated } from "../utils/apiResponse";
import { serializeReport, type PublicReport, type ReportRow } from "../utils/serializers/report.serializer";
import type { CommentRow } from "../utils/serializers/comment.serializer";
import { uploadReportImages, signReportImageUrls } from "./upload.service";
import { createNotification } from "./notification.service";
import type { AuthenticatedUser } from "../types/express";
import type { ReportCategory, ReportSeverity, ReportStatus } from "../types/enums";

interface CreateReportInput {
  category: ReportCategory;
  severity: ReportSeverity;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  files: Express.Multer.File[];
}

interface ListReportsFilters {
  status?: ReportStatus;
  category?: ReportCategory;
  severity?: ReportSeverity;
  search?: string;
  sortBy?: "createdAt" | "severity" | "status";
  sortOrder?: "asc" | "desc";
  page: number;
  limit: number;
  reportedBy?: string;
}

// A fresh fragment per call — postgres.js Query objects are meant to be
// consumed once, so this must not be hoisted into a shared module-level
// constant that gets nested into many different parent queries.
function reportSelect() {
  return sql`
    select
      r.id, r.description, r.severity, r.status, r.images, r.address, r.latitude, r.longitude,
      r.created_at, r.updated_at,
      c.slug as category_slug,
      rb.id as reported_by_id, rb.name as reported_by_name,
      au.id as assigned_to_id, au.name as assigned_to_name
    from public.reports r
    join public.categories c on c.id = r.category_id
    join public.profiles rb on rb.id = r.reported_by
    left join public.profiles au on au.id = r.assigned_to
  `;
}

function reportFilters(filters: ListReportsFilters) {
  return sql`
    where 1=1
    ${filters.status ? sql`and r.status = ${filters.status}` : sql``}
    ${filters.category ? sql`and c.slug = ${filters.category}` : sql``}
    ${filters.severity ? sql`and r.severity = ${filters.severity}` : sql``}
    ${filters.reportedBy ? sql`and r.reported_by = ${filters.reportedBy}` : sql``}
    ${filters.search ? sql`and r.search @@ plainto_tsquery('english', ${filters.search})` : sql``}
  `;
}

// Citizens may only view/interact with reports they filed; officers and admins can access any
// report. Called on every single-report read/write path to prevent IDOR (one citizen reading
// or commenting on another citizen's report by guessing/incrementing its ID).
function assertCanAccessReport(report: { reported_by_id: string }, requester: AuthenticatedUser): void {
  if (requester.role === "officer" || requester.role === "admin") return;
  if (report.reported_by_id !== requester.id) {
    throw ApiError.notFound("Report not found");
  }
}

async function fetchComments(reportId: string): Promise<CommentRow[]> {
  return sql<CommentRow[]>`
    select cm.id, cm.author_id, p.name as author_name, cm.author_role, cm.body, cm.created_at
    from public.comments cm
    join public.profiles p on p.id = cm.author_id
    where cm.report_id = ${reportId}
    order by cm.created_at asc
  `;
}

async function withComments(row: ReportRow): Promise<PublicReport> {
  // The 'reports' Storage bucket is private — row.images holds object paths,
  // not URLs, so every read mints fresh short-lived signed URLs rather than
  // exposing a permanent public link.
  const [comments, images] = await Promise.all([fetchComments(row.id), signReportImageUrls(row.images)]);
  return serializeReport({ ...row, images }, comments);
}

async function findCategoryIdOrThrow(slug: string): Promise<string> {
  const [category] = await sql<{ id: string }[]>`
    select id from public.categories where slug = ${slug} and is_active = true
  `;
  if (!category) throw ApiError.badRequest(`"${slug}" isn't a recognized, active category`);
  return category.id;
}

export async function createReport(reporterId: string, input: CreateReportInput): Promise<PublicReport> {
  const categoryId = await findCategoryIdOrThrow(input.category);

  const images = input.files.length > 0 ? await uploadReportImages(input.files, reporterId) : [];

  const inserted = await sql<{ id: string }[]>`
    insert into public.reports (category_id, severity, description, images, address, latitude, longitude, reported_by)
    values (
      ${categoryId}, ${input.severity}, ${input.description}, ${images},
      ${input.address}, ${input.latitude}, ${input.longitude}, ${reporterId}
    )
    returning id
  `;

  const [row] = await sql<ReportRow[]>`${reportSelect()} where r.id = ${inserted[0]!.id}`;
  return withComments(row!);
}

export async function listReports(filters: ListReportsFilters): Promise<Paginated<PublicReport>> {
  const sortBy = filters.sortBy ?? "createdAt";
  const sortOrder = filters.sortOrder ?? "desc";
  const offset = (filters.page - 1) * filters.limit;

  // report_status / report_severity are native Postgres enums declared in
  // ordinal order (new < under_review < ... and low < moderate < ...), so a
  // plain ORDER BY sorts them correctly with no CASE/rank expression needed.
  const orderColumn = sortBy === "createdAt" ? sql`r.created_at` : sortBy === "severity" ? sql`r.severity` : sql`r.status`;
  const orderDirection = sortOrder === "asc" ? sql`asc` : sql`desc`;

  const [rows, countRows] = await Promise.all([
    sql<ReportRow[]>`
      ${reportSelect()}
      ${reportFilters(filters)}
      order by ${orderColumn} ${orderDirection}
      limit ${filters.limit} offset ${offset}
    `,
    sql<{ count: number }[]>`
      select count(*)::int as count
      from public.reports r
      join public.categories c on c.id = r.category_id
      ${reportFilters(filters)}
    `
  ]);

  const items = await Promise.all(rows.map((r) => withComments(r)));
  return paginate(items, countRows[0]!.count, filters.page, filters.limit);
}

export async function getReportById(id: string, requester: AuthenticatedUser): Promise<PublicReport> {
  const [row] = await sql<ReportRow[]>`${reportSelect()} where r.id = ${id}`;
  if (!row) throw ApiError.notFound("Report not found");
  assertCanAccessReport(row, requester);
  return withComments(row);
}

async function assertReportExists(id: string): Promise<ReportRow> {
  const [row] = await sql<ReportRow[]>`${reportSelect()} where r.id = ${id}`;
  if (!row) throw ApiError.notFound("Report not found");
  return row;
}

export async function updateReportStatus(id: string, status: ReportStatus): Promise<PublicReport> {
  const existing = await assertReportExists(id);

  await sql`update public.reports set status = ${status} where id = ${id}`;

  await createNotification({
    user: existing.reported_by_id,
    type: "report_status_changed",
    title: "Your report status changed",
    body: `Report ${id} is now "${status.replace(/_/g, " ")}"`,
    relatedReport: id
  });

  const [row] = await sql<ReportRow[]>`${reportSelect()} where r.id = ${id}`;
  return withComments(row!);
}

export async function assignReport(id: string, officerId: string): Promise<PublicReport> {
  const existing = await assertReportExists(id);

  const [officer] = await sql<{ id: string; name: string }[]>`
    select id, name from public.profiles where id = ${officerId} and role in ('officer', 'admin')
  `;
  if (!officer) throw ApiError.badRequest("That user isn't a valid officer");

  const nextStatus: ReportStatus =
    existing.status === "new" || existing.status === "under_review" ? "assigned" : (existing.status as ReportStatus);

  await sql`
    update public.reports
    set assigned_to = ${officer.id}, status = ${nextStatus}
    where id = ${id}
  `;

  await createNotification({
    user: existing.reported_by_id,
    type: "report_assigned",
    title: "Your report was assigned",
    body: `Report ${id} was assigned to ${officer.name}`,
    relatedReport: id
  });

  const [row] = await sql<ReportRow[]>`${reportSelect()} where r.id = ${id}`;
  return withComments(row!);
}

export async function updateReportDetails(
  id: string,
  requester: AuthenticatedUser,
  updates: Partial<Pick<CreateReportInput, "category" | "severity" | "description" | "address">>
): Promise<PublicReport> {
  const existing = await assertReportExists(id);

  const isOwner = existing.reported_by_id === requester.id;
  if (!isOwner && requester.role !== "admin") {
    throw ApiError.forbidden("You can only edit your own reports");
  }
  if (existing.status !== "new" && requester.role !== "admin") {
    throw ApiError.badRequest("This report is already being reviewed and can no longer be edited");
  }

  const categoryId = updates.category ? await findCategoryIdOrThrow(updates.category) : null;

  await sql`
    update public.reports
    set
      category_id = coalesce(${categoryId}::uuid, category_id),
      severity = coalesce(${updates.severity ?? null}::report_severity, severity),
      description = coalesce(${updates.description ?? null}::text, description),
      address = coalesce(${updates.address ?? null}::text, address)
    where id = ${id}
  `;

  const [row] = await sql<ReportRow[]>`${reportSelect()} where r.id = ${id}`;
  return withComments(row!);
}

export async function deleteReport(id: string, requester: AuthenticatedUser): Promise<void> {
  const existing = await assertReportExists(id);

  const isOwner = existing.reported_by_id === requester.id;
  if (!isOwner && requester.role !== "admin") {
    throw ApiError.forbidden("You can only delete your own reports");
  }

  // Comments cascade automatically (comments.report_id is ON DELETE CASCADE).
  await sql`delete from public.reports where id = ${id}`;
}

export async function addComment(
  reportId: string,
  author: AuthenticatedUser,
  body: string
): Promise<PublicReport> {
  const existing = await assertReportExists(reportId);
  assertCanAccessReport(existing, author);

  await sql`
    insert into public.comments (report_id, author_id, author_role, body)
    values (${reportId}, ${author.id}, ${author.role}, ${body})
  `;

  if (author.id !== existing.reported_by_id) {
    await createNotification({
      user: existing.reported_by_id,
      type: "report_comment",
      title: "New comment on your report",
      body: `Someone commented on report ${reportId}`,
      relatedReport: reportId
    });
  }

  const [row] = await sql<ReportRow[]>`${reportSelect()} where r.id = ${reportId}`;
  return withComments(row!);
}
