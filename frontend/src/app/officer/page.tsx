"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardList,
  Hourglass,
  Inbox,
  Loader,
  X
} from "lucide-react";

import { getReportStats, getReports, updateReportStatus } from "@/lib/api/reports";
import { useCurrentUser } from "@/hooks/use-current-user";
import { StatCard } from "@/components/dashboard/stat-card";
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
import { Button } from "@/components/ui/button";

type View = "mine" | "queue";

const PAGE_SIZE = 20;

export default function OfficerDashboardPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("mine");
  const [filters, setFilters] = useState<Record<View, ReportFilterValues>>({
    mine: defaultReportFilters,
    // The triage queue has always opened on newly submitted reports.
    queue: { ...defaultReportFilters, status: "new" }
  });
  const [pages, setPages] = useState<Record<View, number>>({ mine: 1, queue: 1 });

  const activeFilters = filters[view];
  const page = pages[view];

  const stats = useQuery({
    queryKey: ["report-stats", { assignedTo: user?.id }],
    queryFn: () => getReportStats({ assignedTo: user!.id }),
    enabled: Boolean(user?.id)
  });

  const listParams = {
    ...toReportListParams(activeFilters),
    ...(view === "mine" ? { assignedTo: user?.id } : {}),
    page,
    limit: PAGE_SIZE
  };

  const reportsQuery = useQuery({
    queryKey: ["reports", "staff", view, listParams],
    queryFn: () => getReports(listParams),
    enabled: view === "queue" || Boolean(user?.id)
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) => updateReportStatus(id, next),
    onSuccess: () => {
      toast.success("Report updated");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["report-stats"] });
    },
    onError: () => toast.error("Couldn't update that report")
  });

  const s = stats.data;
  const openAssigned = s ? s.total - s.byStatus.resolved - s.byStatus.rejected : undefined;
  const reports = reportsQuery.data?.items ?? [];
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <span className="eyebrow mb-1 block">
          {firstName ? `Welcome back, ${firstName}` : "Environmental operations"}
        </span>
        <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100 sm:text-3xl">
          Environmental Officer Dashboard
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-canopy-500 dark:text-canopy-400">
          Monitor, review and respond to environmental reports assigned to you.
        </p>
      </header>

      {stats.isError ? (
        <ErrorState title="Couldn't load your statistics" onRetry={() => stats.refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            label="Open assignments"
            value={openAssigned}
            icon={ClipboardList}
            isLoading={stats.isPending}
            hint="Assigned to you, not closed"
          />
          <StatCard
            label="Not started"
            value={s ? s.byStatus.assigned + s.byStatus.under_review : undefined}
            icon={Hourglass}
            tone="warning"
            isLoading={stats.isPending}
            hint="Assigned or under review"
          />
          <StatCard
            label="In progress"
            value={s?.byStatus.in_progress}
            icon={Loader}
            isLoading={stats.isPending}
          />
          <StatCard
            label="Resolved"
            value={s?.byStatus.resolved}
            icon={CheckCircle2}
            tone="success"
            isLoading={stats.isPending}
          />
          <StatCard
            label="Urgent"
            value={s?.urgentOpen}
            icon={AlertTriangle}
            tone="danger"
            isLoading={stats.isPending}
            hint="High or critical, still open"
          />
        </div>
      )}

      <section className="flex flex-col gap-4">
        <div
          role="tablist"
          aria-label="Report views"
          className="flex w-fit gap-1 rounded-full border border-canopy-100 bg-paper p-1 dark:border-canopy-700 dark:bg-canopy-800"
        >
          {(
            [
              { value: "mine", label: "Assigned to me" },
              { value: "queue", label: "Triage queue" }
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={view === tab.value}
              onClick={() => setView(tab.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                view === tab.value
                  ? "bg-canopy-700 text-paper"
                  : "text-canopy-600 hover:text-canopy-800 dark:text-canopy-300 dark:hover:text-canopy-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-sm text-canopy-500 dark:text-canopy-400">
          {view === "mine"
            ? "Reports an administrator assigned to you, or that you took on from the triage queue."
            : "Every report in the system. Accept new submissions for review, or open one to assign it to yourself."}
        </p>

        <ReportFilters
          key={view}
          value={activeFilters}
          onChange={(next) => {
            setFilters((prev) => ({ ...prev, [view]: next }));
            setPages((prev) => ({ ...prev, [view]: 1 }));
          }}
        />

        {reportsQuery.isPending && (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {reportsQuery.isError && (
          <ErrorState title="Couldn't load reports" onRetry={() => reportsQuery.refetch()} />
        )}

        {!reportsQuery.isPending && !reportsQuery.isError && reports.length === 0 && (
          <EmptyState
            icon={Inbox}
            title={view === "mine" ? "Nothing assigned to you" : "Queue is empty"}
            description={
              view === "mine"
                ? JSON.stringify(activeFilters) === JSON.stringify(defaultReportFilters)
                  ? "No environmental reports are currently assigned to you. Check the triage queue for new submissions."
                  : "None of your assigned reports match these filters."
                : "No reports match these filters right now."
            }
          />
        )}

        {!reportsQuery.isPending && !reportsQuery.isError && reports.length > 0 && (
          <>
            <ReportTable
              reports={reports}
              detailHref={(id) => `/officer/reports/${id}`}
              showAssignee={view === "queue"}
              renderActions={(report) =>
                view === "queue" && report.status === "new" ? (
                  <>
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: report.id, next: "under_review" })}
                    >
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-3 py-1.5 text-xs"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: report.id, next: "rejected" })}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                ) : null
              }
            />
            <Pagination
              page={page}
              totalPages={reportsQuery.data?.totalPages ?? 1}
              onPageChange={(next) => setPages((prev) => ({ ...prev, [view]: next }))}
            />
          </>
        )}
      </section>
    </div>
  );
}
