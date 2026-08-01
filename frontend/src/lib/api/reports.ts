import { apiClient } from "@/lib/api/client";
import type {
  CreateReportPayload,
  PaginatedResponse,
  Report,
  ReportListParams
} from "@/types/report";

export async function createReport(payload: CreateReportPayload): Promise<Report> {
  const formData = new FormData();
  formData.append("category", payload.category);
  formData.append("description", payload.description);
  formData.append("severity", payload.severity);
  formData.append("latitude", String(payload.latitude));
  formData.append("longitude", String(payload.longitude));
  formData.append("address", payload.address);
  payload.images.forEach((file) => formData.append("images", file));

  const { data } = await apiClient.post<Report>("/reports", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

export async function getReports(params: ReportListParams): Promise<PaginatedResponse<Report>> {
  const { data } = await apiClient.get<PaginatedResponse<Report>>("/reports", { params });
  return data;
}

export async function getMyReports(params: ReportListParams): Promise<PaginatedResponse<Report>> {
  const { data } = await apiClient.get<PaginatedResponse<Report>>("/reports/mine", { params });
  return data;
}

export async function getReportById(id: string): Promise<Report> {
  const { data } = await apiClient.get<Report>(`/reports/${id}`);
  return data;
}

export interface UpdateReportPayload {
  category?: string;
  severity?: string;
  description?: string;
  address?: string;
}

export async function updateReport(id: string, payload: UpdateReportPayload): Promise<Report> {
  const { data } = await apiClient.patch<Report>(`/reports/${id}`, payload);
  return data;
}

export async function deleteReport(id: string): Promise<void> {
  await apiClient.delete(`/reports/${id}`);
}

export async function updateReportStatus(id: string, status: string): Promise<Report> {
  const { data } = await apiClient.patch<Report>(`/reports/${id}/status`, { status });
  return data;
}

export async function assignReport(id: string, officerId: string): Promise<Report> {
  const { data } = await apiClient.patch<Report>(`/reports/${id}/assign`, { officerId });
  return data;
}

export async function addComment(id: string, body: string): Promise<Report> {
  const { data } = await apiClient.post<Report>(`/reports/${id}/comments`, { body });
  return data;
}
