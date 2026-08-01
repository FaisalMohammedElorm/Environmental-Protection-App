"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Inbox, Check, X, ArrowUpRight, Search, ChevronLeft, ChevronRight } from "lucide-react";

import { getReports, updateReportStatus } from "@/lib/api/reports";
import { formatCategoryLabel, statusLabels, type ReportStatus } from "@/types/report";
import { StatusBadge, SeverityBadge } from "@/components/dashboard/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

const statusFilters: Array<{ value: ReportStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "new", label: statusLabels.new },
  { value: "under_review", label: statusLabels.under_review },
  { value: "assigned", label: statusLabels.assigned },
  { value: "in_progress", label: statusLabels.in_progress },
  { value: "resolved", label: statusLabels.resolved },
  { value: "rejected", label: statusLabels.rejected }
];

const sortOptions: Array<{ value: string; sortBy: "createdAt" | "severity"; sortOrder: "asc" | "desc"; label: string }> = [
  { value: "newest", sortBy: "createdAt", sortOrder: "desc", label: "Newest first" },
  { value: "oldest", sortBy: "createdAt", sortOrder: "asc", label: "Oldest first" },
  { value: "severity-desc", sortBy: "severity", sortOrder: "desc", label: "Most severe first" },
  { value: "severity-asc", sortBy: "severity", sortOrder: "asc", label: "Least severe first" }
];

export default function OfficerQueuePage() {
  const [status, setStatus] = useState<ReportStatus | "all">("new");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(sortOptions[0]!);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "all", { status, search, sort: sort.value, page }],
    queryFn: () =>
      getReports({
        status: status === "all" ? undefined : status,
        search: search || undefined,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        page,
        limit: 20
      })
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) => updateReportStatus(id, next),
    onSuccess: () => {
      toast.success("Report updated");
      queryClient.invalidateQueries({ queryKey: ["reports", "all"] });
    },
    onError: () => toast.error("Couldn't update that report")
  });

  const reports = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
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

        <select
          value={sort.value}
          onChange={(e) => {
            const next = sortOptions.find((o) => o.value === e.target.value);
            if (next) setSort(next);
            setPage(1);
          }}
          className="rounded-xl border border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 py-2 px-3 text-sm text-canopy-800 dark:text-canopy-100 outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && (isError || reports.length === 0) && (
        <EmptyState icon={Inbox} title="Queue is empty" description="No reports match this filter right now." />
      )}

      {!isLoading && reports.length > 0 && (
        <>
          <div className="card divide-y divide-canopy-100 dark:divide-canopy-700">
            {reports.map((report) => (
              <div key={report.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <Link href={`/officer/reports/${report.id}`} className="min-w-[200px] flex-1 hover:underline">
                  <p className="font-medium text-canopy-800 dark:text-canopy-100">{formatCategoryLabel(report.category)}</p>
                  <p className="text-xs text-canopy-400 dark:text-canopy-500">
                    {report.location.address} · by {report.reportedBy.name}
                  </p>
                </Link>

                <div className="flex items-center gap-2">
                  <SeverityBadge severity={report.severity} />
                  <StatusBadge status={report.status} />
                </div>

                {report.status === "new" && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => statusMutation.mutate({ id: report.id, next: "under_review" })}
                    >
                      <Check className="h-4 w-4" /> Accept
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => statusMutation.mutate({ id: report.id, next: "rejected" })}
                    >
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}

                <Link href={`/officer/reports/${report.id}`} className="text-canopy-300 dark:text-canopy-600 hover:text-canopy-600 dark:hover:text-canopy-300">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
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
