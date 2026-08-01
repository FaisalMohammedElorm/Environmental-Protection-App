"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line
} from "recharts";

import { getAnalyticsSummary } from "@/lib/api/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCategoryLabel } from "@/types/report";

export function AnalyticsDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: getAnalyticsSummary
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-canopy-500 dark:text-canopy-400">Analytics data isn't available right now.</p>;
  }

  const categoryData = data.categoryDistribution.map((d) => ({
    name: formatCategoryLabel(d.category),
    count: d.count
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-6">
          <p className="eyebrow mb-2">Total reports</p>
          <p className="font-display text-3xl font-semibold text-canopy-800 dark:text-canopy-100">{data.totalReports}</p>
        </div>
        <div className="card p-6">
          <p className="eyebrow mb-2">Resolved</p>
          <p className="font-display text-3xl font-semibold text-canopy-800 dark:text-canopy-100">{data.resolvedReports}</p>
        </div>
        <div className="card p-6">
          <p className="eyebrow mb-2">Pending</p>
          <p className="font-display text-3xl font-semibold text-canopy-800 dark:text-canopy-100">{data.pendingReports}</p>
        </div>
        <div className="card p-6">
          <p className="eyebrow mb-2">Users</p>
          <p className="font-display text-3xl font-semibold text-canopy-800 dark:text-canopy-100">{data.totalUsers}</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">Category distribution</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EFEA" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#3F7455" }} interval={0} angle={-20} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11, fill: "#3F7455" }} />
            <Tooltip />
            <Bar dataKey="count" fill="#1F7A4D" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">Monthly trends</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EFEA" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#3F7455" }} />
            <YAxis tick={{ fontSize: 11, fill: "#3F7455" }} />
            <Tooltip />
            <Line type="monotone" dataKey="reports" stroke="#1F7A4D" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="resolved" stroke="#E2933C" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-hidden">
        <h3 className="p-6 pb-0 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">Officer performance</h3>
        <div className="overflow-x-auto">
        <table className="mt-4 w-full text-left text-sm">
          <thead className="border-b border-canopy-100 dark:border-canopy-700 bg-mist/60 dark:bg-canopy-800/60">
            <tr>
              <th className="px-6 py-3 font-medium text-canopy-500 dark:text-canopy-400">Officer</th>
              <th className="px-6 py-3 font-medium text-canopy-500 dark:text-canopy-400">Resolved</th>
              <th className="px-6 py-3 font-medium text-canopy-500 dark:text-canopy-400">Avg. response</th>
            </tr>
          </thead>
          <tbody>
            {data.officerPerformance.map((o) => (
              <tr key={o.officerName} className="border-b border-canopy-100 dark:border-canopy-700 last:border-0">
                <td className="px-6 py-3 font-medium text-canopy-800 dark:text-canopy-100">{o.officerName}</td>
                <td className="px-6 py-3 text-canopy-600 dark:text-canopy-300">{o.resolved}</td>
                <td className="px-6 py-3 font-mono text-xs text-canopy-500 dark:text-canopy-400">{o.avgResponseHours}h</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
