import { supabase } from "@/lib/supabase/client";
import { createReportAction, getReportImageUrlsAction } from "@/app/actions/reports";
import type {
  CreateReportPayload,
  PaginatedResponse,
  Report,
  ReportComment,
  ReportListParams,
  ReportStatus
} from "@/types/report";

// Disambiguated via the FK column name — reports has two FKs to profiles
// (reported_by, assigned_to), so PostgREST needs the hint to know which one
// each embed refers to.
const REPORT_SELECT =
  "id, description, severity, status, images, address, latitude, longitude, created_at, updated_at, " +
  "category:categories(slug), " +
  "reportedBy:profiles!reported_by(id, name), " +
  "assignedTo:profiles!assigned_to(id, name), " +
  "comments(id, body, created_at, author_role, author:profiles!author_id(name))";

interface ReportRow {
  id: string;
  description: string;
  severity: string;
  status: string;
  images: string[];
  address: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  category: { slug: string } | null;
  reportedBy: { id: string; name: string } | null;
  assignedTo: { id: string; name: string } | null;
  comments: Array<{ id: string; body: string; created_at: string; author_role: string; author: { name: string } | null }>;
}

async function serializeReport(row: ReportRow): Promise<Report> {
  const imageUrls = row.images && row.images.length > 0 ? await getReportImageUrlsAction(row.id) : [];

  const comments: ReportComment[] = (row.comments ?? [])
    .map((c) => ({
      id: c.id,
      authorName: c.author?.name ?? "Unknown",
      authorRole: c.author_role as ReportComment["authorRole"],
      body: c.body,
      createdAt: c.created_at
    }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return {
    id: row.id,
    category: row.category?.slug ?? "",
    description: row.description,
    severity: row.severity as Report["severity"],
    status: row.status as Report["status"],
    images: imageUrls,
    location: { address: row.address, latitude: row.latitude, longitude: row.longitude },
    reportedBy: row.reportedBy ?? { id: "", name: "Unknown" },
    assignedTo: row.assignedTo ?? undefined,
    comments,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function resolveCategoryId(slug: string): Promise<string> {
  const { data, error } = await supabase.from("categories").select("id").eq("slug", slug).eq("is_active", true).single();
  if (error || !data) throw new Error(`"${slug}" isn't a recognized, active category`);
  return data.id;
}

function sortColumn(sortBy: ReportListParams["sortBy"]): string {
  if (sortBy === "severity") return "severity";
  if (sortBy === "status") return "status";
  return "created_at";
}

async function fetchReportsList(params: ReportListParams, ownerId?: string): Promise<PaginatedResponse<Report>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("reports").select(REPORT_SELECT, { count: "exact" });

  if (ownerId) query = query.eq("reported_by", ownerId);
  if (params.status) query = query.eq("status", params.status);
  if (params.severity) query = query.eq("severity", params.severity);
  if (params.category) query = query.eq("category_id", await resolveCategoryId(params.category));
  if (params.search) query = query.textSearch("search", params.search, { type: "plain" });

  query = query.order(sortColumn(params.sortBy), { ascending: (params.sortOrder ?? "desc") === "asc" }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as ReportRow[];
  const items = await Promise.all(rows.map(serializeReport));
  const total = count ?? 0;

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function createReport(payload: CreateReportPayload): Promise<Report> {
  const formData = new FormData();
  formData.append("category", payload.category);
  formData.append("description", payload.description);
  formData.append("severity", payload.severity);
  formData.append("latitude", String(payload.latitude));
  formData.append("longitude", String(payload.longitude));
  formData.append("address", payload.address);
  payload.images.forEach((file) => formData.append("images", file));

  const result = await createReportAction(formData);
  if ("error" in result) throw new Error(result.error);
  return getReportById(result.id);
}

export async function getReports(params: ReportListParams): Promise<PaginatedResponse<Report>> {
  return fetchReportsList(params);
}

export async function getMyReports(params: ReportListParams): Promise<PaginatedResponse<Report>> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return fetchReportsList(params, user.id);
}

export async function getReportById(id: string): Promise<Report> {
  const { data, error } = await supabase.from("reports").select(REPORT_SELECT).eq("id", id).single();
  if (error || !data) throw error ?? new Error("Report not found");
  return serializeReport(data as unknown as ReportRow);
}

export interface UpdateReportPayload {
  category?: string;
  severity?: string;
  description?: string;
  address?: string;
}

export async function updateReport(id: string, payload: UpdateReportPayload): Promise<Report> {
  const update: Record<string, unknown> = {};
  if (payload.severity !== undefined) update.severity = payload.severity;
  if (payload.description !== undefined) update.description = payload.description;
  if (payload.address !== undefined) update.address = payload.address;
  if (payload.category !== undefined) update.category_id = await resolveCategoryId(payload.category);

  const { error } = await supabase.from("reports").update(update).eq("id", id);
  if (error) throw error;
  return getReportById(id);
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) throw error;
}

export async function updateReportStatus(id: string, status: string): Promise<Report> {
  const { error } = await supabase.from("reports").update({ status }).eq("id", id);
  if (error) throw error;
  return getReportById(id);
}

export async function assignReport(id: string, officerId: string): Promise<Report> {
  const { data: officer, error: officerError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", officerId)
    .in("role", ["officer", "admin"])
    .single();
  if (officerError || !officer) throw new Error("That user isn't a valid officer");

  const { data: existing, error: existingError } = await supabase.from("reports").select("status").eq("id", id).single();
  if (existingError || !existing) throw new Error("Report not found");

  // Mirrors report.service.ts's assignReport rule: only bump status to
  // 'assigned' if it hasn't progressed past triage yet.
  const nextStatus: ReportStatus =
    existing.status === "new" || existing.status === "under_review" ? "assigned" : (existing.status as ReportStatus);

  const { error } = await supabase.from("reports").update({ assigned_to: officer.id, status: nextStatus }).eq("id", id);
  if (error) throw error;
  return getReportById(id);
}

export async function addComment(id: string, body: string): Promise<Report> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profileError || !profile) throw new Error("Profile not found");

  const { error } = await supabase.from("comments").insert({
    report_id: id,
    author_id: user.id,
    author_role: profile.role,
    body
  });
  if (error) throw error;
  return getReportById(id);
}
