"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FilePlus2, FileText, ArrowUpRight } from "lucide-react";

import { getMyReports } from "@/lib/api/reports";
import { formatCategoryLabel } from "@/types/report";
import { StatusBadge, SeverityBadge } from "@/components/dashboard/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardOverviewPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "mine", { page: 1 }],
    queryFn: () => getMyReports({ page: 1, limit: 5 })
  });

  const reports = data?.items ?? [];
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;
  const openCount = reports.length - resolvedCount;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <p className="eyebrow mb-2">Total filed</p>
          <p className="font-display text-3xl font-semibold text-canopy-800 dark:text-canopy-100">{data?.total ?? "—"}</p>
        </div>
        <div className="card p-6">
          <p className="eyebrow mb-2">Open</p>
          <p className="font-display text-3xl font-semibold text-canopy-800 dark:text-canopy-100">{openCount}</p>
        </div>
        <div className="card p-6">
          <p className="eyebrow mb-2">Resolved</p>
          <p className="font-display text-3xl font-semibold text-canopy-800 dark:text-canopy-100">{resolvedCount}</p>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-canopy-800 dark:text-canopy-100">Recent reports</h2>
          <Link
            href="/dashboard/report/new"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-canopy-700 dark:text-canopy-200 hover:text-canopy-800 dark:hover:text-canopy-100"
          >
            <FilePlus2 className="h-4 w-4" />
            New report
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {!isLoading && (isError || reports.length === 0) && (
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Once you file a report, you'll see its status here from submission to resolution."
            actionHref="/dashboard/report/new"
            actionLabel="Submit your first report"
          />
        )}

        {!isLoading && reports.length > 0 && (
          <div className="card divide-y divide-canopy-100 dark:divide-canopy-700">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/reports/${report.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-mist/50 dark:hover:bg-canopy-800/50"
              >
                <div>
                  <p className="font-medium text-canopy-800 dark:text-canopy-100">{formatCategoryLabel(report.category)}</p>
                  <p className="text-xs text-canopy-400 dark:text-canopy-500">{report.location.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={report.severity} />
                  <StatusBadge status={report.status} />
                  <ArrowUpRight className="h-4 w-4 text-canopy-300 dark:text-canopy-600" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
