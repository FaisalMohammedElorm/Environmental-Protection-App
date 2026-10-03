"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Hourglass,
  Loader,
  ShieldCheck,
  UserX,
  Users
} from "lucide-react";

import { getReportStats } from "@/lib/api/reports";
import { getPeopleCounts } from "@/lib/api/admin-users";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { ErrorState } from "@/components/ui/error-state";

const cardLink = "block rounded-2xl transition-transform hover:-translate-y-0.5";

export default function AdminOverviewPage() {
  const stats = useQuery({ queryKey: ["report-stats", "system"], queryFn: () => getReportStats() });
  const people = useQuery({ queryKey: ["admin", "people-counts"], queryFn: getPeopleCounts });

  const s = stats.data;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow mb-1 block">Administration</span>
          <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100 sm:text-3xl">
            Environmental overview
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-canopy-500 dark:text-canopy-400">
            System-wide view of environmental reports, officer capacity and community participation.
          </p>
        </div>
        <Link href="/admin/reports" className="btn-primary px-5 py-2.5">
          Manage reports <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>

      {stats.isError || people.isError ? (
        <ErrorState
          title="Couldn't load overview statistics"
          onRetry={() => {
            stats.refetch();
            people.refetch();
          }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Link href="/admin/reports" className={cardLink}>
            <StatCard
              label="Total reports"
              value={s?.total}
              icon={FileText}
              isLoading={stats.isPending}
            />
          </Link>
          <StatCard
            label="Pending review"
            value={s ? s.byStatus.new + s.byStatus.under_review : undefined}
            icon={Hourglass}
            tone="warning"
            hint="New or under review"
            isLoading={stats.isPending}
          />
          <StatCard
            label="In progress"
            value={s ? s.byStatus.assigned + s.byStatus.in_progress : undefined}
            icon={Loader}
            hint="Assigned or being worked on"
            isLoading={stats.isPending}
          />
          <Link href="/admin/reports?status=resolved" className={cardLink}>
            <StatCard
              label="Resolved"
              value={s?.byStatus.resolved}
              icon={CheckCircle2}
              tone="success"
              isLoading={stats.isPending}
            />
          </Link>
          <Link href="/admin/reports?officer=unassigned" className={cardLink}>
            <StatCard
              label="Awaiting assignment"
              value={s?.unassignedOpen}
              icon={UserX}
              tone="warning"
              hint="Open, no officer assigned"
              isLoading={stats.isPending}
            />
          </Link>
          <StatCard
            label="Urgent open"
            value={s?.urgentOpen}
            icon={AlertTriangle}
            tone="danger"
            hint="High or critical severity"
            isLoading={stats.isPending}
          />
          <Link href="/admin/officers" className={cardLink}>
            <StatCard
              label="Active officers"
              value={people.data?.activeOfficers}
              icon={ShieldCheck}
              isLoading={people.isPending}
            />
          </Link>
          <Link href="/admin/users" className={cardLink}>
            <StatCard
              label="Registered citizens"
              value={people.data?.citizens}
              icon={Users}
              isLoading={people.isPending}
            />
          </Link>
        </div>
      )}

      <AnalyticsDashboard showSummary={false} />
    </div>
  );
}
