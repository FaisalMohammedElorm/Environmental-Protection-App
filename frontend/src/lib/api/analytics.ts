import { apiClient } from "@/lib/api/client";

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
  const { data } = await apiClient.get<AnalyticsSummary>("/analytics/summary");
  return data;
}
