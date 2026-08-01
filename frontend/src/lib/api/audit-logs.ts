import { apiClient } from "@/lib/api/client";
import type { AuditLogEntry } from "@/types/audit-log";
import type { PaginatedResponse } from "@/types/report";

export async function getAuditLogs(page = 1): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<AuditLogEntry>>("/admin/audit-logs", {
    params: { page, limit: 25 }
  });
  return data;
}
