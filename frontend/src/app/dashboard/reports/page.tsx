"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, ChevronLeft, ChevronRight, ArrowUpRight, Search } from "lucide-react";

import { getMyReports } from "@/lib/api/reports";
import { formatCategoryLabel, statusLabels, type ReportStatus } from "@/types/report";
import { StatusBadge, SeverityBadge } from "@/components/dashboard/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const statusFilters: Array<{ value: ReportStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "new", label: statusLabels.new },
  { value: "under_review", label: statusLabels.under_review },
  { value: "assigned", label: statusLabels.assigned },
  { value: "in_progress", label: statusLabels.in_progress },
  { value: "resolved", label: statusLabels.resolved },
  { value: "rejected", label: statusLabels.rejected }
];

export default function MyReportsPage() {
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "mine", { status, search, page }],
    queryFn: () =>
      getMyReports({ status: status === "all" ? undefined : status, search: search || undefined, page, limit: 8 })
  });

  const reports = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow mb-2 block">My reports</span>
          <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">Everything you've filed</h2>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-canopy-300 dark:text-canopy-600" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search description or location"
            className="w-64 rounded-xl border border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 py-2 pl-9 pr-3 text-sm text-canopy-800 dark:text-canopy-100 outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              status === filter.value
                ? "bg-canopy-700 text-paper"
                : "border border-canopy-100 dark:border-canopy-700 text-canopy-600 dark:text-canopy-300 hover:border-canopy-700"
            }`}
          >
            {filter.label}
          </button>
        ))}
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
          title="Nothing here yet"
          description="Reports matching this filter will show up here once you file them."
          actionHref="/dashboard/report/new"
          actionLabel="Submit a report"
        />
      )}

      {!isLoading && reports.length > 0 && (
        <>
          <div className="card divide-y divide-canopy-100 dark:divide-canopy-700">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/reports/${report.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-mist/50 dark:hover:bg-canopy-800/50"
              >
                <div>
                  <p className="font-medium text-canopy-800 dark:text-canopy-100">{formatCategoryLabel(report.category)}</p>
                  <p className="text-xs text-canopy-400 dark:text-canopy-500">
                    {report.location.address} · {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={report.severity} />
                  <StatusBadge status={report.status} />
                  <ArrowUpRight className="h-4 w-4 text-canopy-300 dark:text-canopy-600" />
                </div>
              </Link>
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 text-sm font-medium text-canopy-600 dark:text-canopy-300 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-xs text-canopy-400 dark:text-canopy-500">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 text-sm font-medium text-canopy-600 dark:text-canopy-300 disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
