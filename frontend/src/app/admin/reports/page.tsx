"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";

import { getReports } from "@/lib/api/reports";
import { getUsers } from "@/lib/api/admin-users";
import { statusLabels, type ReportStatus } from "@/types/report";
import {
  ReportFilters,
  defaultReportFilters,
  toReportListParams,
  type ReportFilterValues
} from "@/components/reports/report-filters";
import { Pagination, ReportTable } from "@/components/reports/report-table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

const PAGE_SIZE = 20;

function parseStatus(raw: string | null): ReportFilterValues["status"] {
  return raw && raw in statusLabels ? (raw as ReportStatus) : "all";
}

function AdminReportsContent() {
  const searchParams = useSearchParams();
  // Deep-linkable from the officer roster ("View assigned reports") and overview cards.
  const [filters, setFilters] = useState<ReportFilterValues>(() => ({
    ...defaultReportFilters,
    assignedTo: searchParams.get("officer") ?? "",
    status: parseStatus(searchParams.get("status"))
  }));
  const [page, setPage] = useState(1);

  const { data: officerData } = useQuery({
    queryKey: ["admin", "users", { role: "officer", limit: 100 }],
    queryFn: () => getUsers({ role: "officer", page: 1, limit: 100 })
  });
  const officers = (officerData?.items ?? []).map((o) => ({
    id: o.id,
    name: o.isActive ? o.name : `${o.name} (inactive)`
  }));

  const listParams = { ...toReportListParams(filters), page, limit: PAGE_SIZE };
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["reports", "staff", "admin", listParams],
    queryFn: () => getReports(listParams)
  });

  const reports = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow mb-1 block">Report management</span>
          <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">
            All environmental reports
          </h2>
          <p className="mt-1 text-sm text-canopy-500 dark:text-canopy-400">
            Review every report, assign environmental officers, and track progress to resolution.
          </p>
        </div>
        {data && (
          <p className="font-mono text-xs text-canopy-400 dark:text-canopy-500">
            {data.total} report{data.total === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <ReportFilters
        value={filters}
        officers={officers}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      {isPending && (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {isError && <ErrorState title="Couldn't load reports" onRetry={() => refetch()} />}

      {!isPending && !isError && reports.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No reports found"
          description="No environmental reports match these filters."
        />
      )}

      {!isPending && !isError && reports.length > 0 && (
        <>
          <ReportTable reports={reports} detailHref={(id) => `/admin/reports/${id}`} showAssignee />
          <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  // useSearchParams needs a Suspense boundary for Next's static prerender pass.
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <AdminReportsContent />
    </Suspense>
  );
}
