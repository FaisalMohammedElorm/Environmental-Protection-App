import { apiClient } from "@/lib/api/client";

export interface SystemSettings {
  siteName: string;
  supportEmail: string;
  autoAssignReports: boolean;
  reportResolutionSlaHours: number;
  allowPublicReportSubmission: boolean;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const { data } = await apiClient.get<SystemSettings>("/admin/settings");
  return data;
}

export async function updateSystemSettings(payload: SystemSettings): Promise<SystemSettings> {
  const { data } = await apiClient.put<SystemSettings>("/admin/settings", payload);
  return data;
}
