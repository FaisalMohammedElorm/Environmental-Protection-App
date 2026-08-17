import { supabase } from "@/lib/supabase/client";

export interface AnalyticsSummary {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  totalUsers: number;
  categoryDistribution: Array<{ category: string; count: number }>;
  monthlyTrends: Array<{ month: string; reports: number; resolved: number }>;
  officerPerformance: Array<{ officerName: string; resolved: number; avgResponseHours: number }>;
}

interface AnalyticsSummaryRpcResult {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  totalUsers: number;
  categoryDistribution: Array<{ category: string; count: number }>;
  monthlyTrends: Array<{ month: string; reports: number; resolved: number }>;
  officerPerformance: Array<{ name: string; resolved: number; avgResponseHours: number }>;
}

// Backed by the get_analytics_summary() RPC (supabase/migrations/0011_client_direct_access.sql)
// — the real GROUP BY/FILTER/date_trunc/avg(interval) aggregation doesn't map to chained
// client .select() calls, and needs to see all reports regardless of RLS ownership scoping.
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const { data, error } = await supabase.rpc("get_analytics_summary");
  if (error) throw error;

  const raw = data as AnalyticsSummaryRpcResult;
  return {
    totalReports: raw.totalReports,
    resolvedReports: raw.resolvedReports,
    pendingReports: raw.pendingReports,
    totalUsers: raw.totalUsers,
    categoryDistribution: raw.categoryDistribution,
    monthlyTrends: raw.monthlyTrends,
    officerPerformance: raw.officerPerformance.map((o) => ({
      officerName: o.name,
      resolved: o.resolved,
      avgResponseHours: o.avgResponseHours
    }))
  };
}
