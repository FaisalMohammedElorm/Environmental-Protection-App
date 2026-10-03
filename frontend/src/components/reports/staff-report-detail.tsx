"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSearch,
  History,
  ImageOff,
  Info,
  MapPin,
  Send,
  User,
  UserPlus
} from "lucide-react";

import { addComment, assignReport, getReportById, updateReportStatus } from "@/lib/api/reports";
import { getUsers } from "@/lib/api/admin-users";
import { getReportActivity } from "@/lib/api/audit-logs";
import { formatCategoryLabel, statusLabels, type ReportStatus } from "@/types/report";
import type { AuditLogEntry } from "@/types/audit-log";
import { StatusBadge, SeverityBadge } from "@/components/dashboard/badges";
import { shortReportId } from "@/components/reports/report-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useCurrentUser } from "@/hooks/use-current-user";

// "new" is the citizen's submission state — staff move reports forward from it, never back to it.
const workflowStatuses: ReportStatus[] = [
  "under_review",
  "assigned",
  "in_progress",
  "resolved",
  "rejected"
];

const fieldClass =
  "w-full rounded-xl border border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 px-3 py-2.5 text-sm text-canopy-800 dark:text-canopy-100 outline-none focus:border-moss focus:ring-2 focus:ring-moss/20";

interface StaffReportDetailProps {
  reportId: string;
  mode: "officer" | "admin";
  backHref: string;
}

export function StaffReportDetail({ reportId, mode, backHref }: StaffReportDetailProps) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [comment, setComment] = useState("");
  const [nextStatus, setNextStatus] = useState<ReportStatus | "">("");
  const [selectedOfficer, setSelectedOfficer] = useState("");

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["reports", reportId],
    queryFn: () => getReportById(reportId)
  });

  const { data: officerData } = useQuery({
    queryKey: ["admin", "users", { role: "officer", limit: 100 }],
    queryFn: () => getUsers({ role: "officer", page: 1, limit: 100 }),
    enabled: mode === "admin"
  });
  const activeOfficers = (officerData?.items ?? []).filter((o) => o.isActive);

  const { data: activity, isLoading: isActivityLoading } = useQuery({
    queryKey: ["admin", "report-activity", reportId],
    queryFn: () => getReportActivity(reportId),
    enabled: mode === "admin"
  });

  const invalidate = () => {
    // Prefix match covers this report, every staff/citizen report list, and the dashboard stats.
    queryClient.invalidateQueries({ queryKey: ["reports"] });
    queryClient.invalidateQueries({ queryKey: ["report-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: ReportStatus) => updateReportStatus(reportId, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(["reports", reportId], updated);
      setNextStatus("");
      toast.success(`Status set to ${statusLabels[updated.status].toLowerCase()}`);
      invalidate();
    },
    onError: () => toast.error("Couldn't update the status")
  });

  const assignMutation = useMutation({
    mutationFn: (officerId: string) => assignReport(reportId, officerId),
    onSuccess: (updated) => {
      queryClient.setQueryData(["reports", reportId], updated);
      setSelectedOfficer("");
      toast.success(
        updated.assignedTo ? `Assigned to ${updated.assignedTo.name}` : "Report assigned"
      );
      invalidate();
    },
    onError: () => toast.error("Couldn't assign this report")
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => addComment(reportId, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(["reports", reportId], updated);
      setComment("");
      toast.success("Update posted");
    },
    onError: () => toast.error("Couldn't post that update")
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-1/2" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 w-full lg:col-span-2" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !report) {
    // PGRST116 = .single() matched zero rows: missing, or hidden from this user by RLS.
    const notFound =
      (error as { code?: string } | null)?.code === "PGRST116" || (!isError && !report);
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <BackLink href={backHref} />
        {notFound ? (
          <EmptyState
            icon={FileSearch}
            title="Report not found"
            description="This report doesn't exist, was deleted, or you don't have permission to view it."
            actionHref={backHref}
            actionLabel="Back to reports"
          />
        ) : (
          <ErrorState
            description="We couldn't load this report right now."
            onRetry={() => refetch()}
          />
        )}
      </div>
    );
  }

  const isAssignedToMe = Boolean(currentUser && report.assignedTo?.id === currentUser.id);
  const isAssignedToSomeoneElse = Boolean(report.assignedTo && !isAssignedToMe);
  const isClosed = report.status === "resolved" || report.status === "rejected";
  const statusChoices = workflowStatuses.filter((s) => s !== report.status);
  const officerNameById = new Map((officerData?.items ?? []).map((o) => [o.id, o.name]));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <BackLink href={backHref} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="eyebrow mb-1 block">Report #{shortReportId(report.id)}</span>
          <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">
            {formatCategoryLabel(report.category)}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <SeverityBadge severity={report.severity} />
          <StatusBadge status={report.status} />
        </div>
      </div>

      {mode === "officer" && isAssignedToSomeoneElse && (
        <p className="flex items-start gap-2 rounded-xl border border-alert-amber/30 bg-alert-amber/10 px-4 py-3 text-sm text-canopy-700 dark:text-canopy-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-alert-amber" />
          This report is assigned to {report.assignedTo?.name}. Coordinate with them before changing
          its status.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Evidence, description, location, updates */}
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5 sm:p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
              Evidence
            </h3>
            {report.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {report.images.map((src, i) => (
                  <a
                    key={src}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square w-full overflow-hidden rounded-xl"
                  >
                    <Image
                      src={src}
                      alt={`Evidence photo ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-canopy-400 dark:text-canopy-500">
                <ImageOff className="h-4 w-4" /> No photos were attached to this report.
              </p>
            )}

            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-canopy-700 dark:text-canopy-200">
              {report.description}
            </p>

            <div className="mt-5 flex flex-col gap-2 border-t border-canopy-100 pt-4 text-sm text-canopy-600 dark:border-canopy-700 dark:text-canopy-300">
              <span className="inline-flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-canopy-400" />
                {report.location.address}
              </span>
              <span className="pl-6 font-mono text-xs text-canopy-400 dark:text-canopy-500">
                {report.location.latitude.toFixed(5)}, {report.location.longitude.toFixed(5)}
              </span>
              <a
                href={`https://www.openstreetmap.org/?mlat=${report.location.latitude}&mlon=${report.location.longitude}#map=17/${report.location.latitude}/${report.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1.5 pl-6 text-xs font-semibold text-moss-dark hover:underline dark:text-moss-light"
              >
                Open location in map <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </section>

          <section>
            <h3 className="mb-1 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
              Updates & comments
            </h3>
            <p className="mb-3 text-xs text-canopy-400 dark:text-canopy-500">
              Updates posted here are visible to the citizen who filed the report.
            </p>
            <div className="card divide-y divide-canopy-100 dark:divide-canopy-700">
              {report.comments.length === 0 && (
                <p className="px-6 py-6 text-sm text-canopy-400 dark:text-canopy-500">
                  No updates yet.
                </p>
              )}
              {report.comments.map((c) => (
                <div key={c.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-canopy-800 dark:text-canopy-100">
                      {c.authorName}
                    </p>
                    <span className="text-xs capitalize text-canopy-400 dark:text-canopy-500">
                      {c.authorRole}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-canopy-600 dark:text-canopy-300">
                    {c.body}
                  </p>
                  <p className="mt-1 text-xs text-canopy-300 dark:text-canopy-600">
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <form
              className="mt-4 flex gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (comment.trim()) commentMutation.mutate(comment.trim());
              }}
            >
              <label className="sr-only" htmlFor="staff-comment">
                Post an update
              </label>
              <input
                id="staff-comment"
                value={comment}
                maxLength={1000}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Post an update for the citizen..."
                className="min-w-0 flex-1 rounded-xl border border-canopy-100 bg-paper px-4 py-2.5 text-sm text-canopy-800 outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 dark:border-canopy-700 dark:bg-canopy-800 dark:text-canopy-100"
              />
              <Button
                type="submit"
                isLoading={commentMutation.isPending}
                disabled={!comment.trim()}
                aria-label="Post update"
                className="px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </section>
        </div>

        {/* Response workflow */}
        <aside className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
              Response
            </h3>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (nextStatus) statusMutation.mutate(nextStatus);
              }}
            >
              <label
                htmlFor="next-status"
                className="text-sm font-medium text-canopy-700 dark:text-canopy-200"
              >
                Update status
              </label>
              <select
                id="next-status"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as ReportStatus)}
                className={fieldClass}
              >
                <option value="" disabled>
                  Currently: {statusLabels[report.status]}
                </option>
                {statusChoices.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                variant="secondary"
                disabled={!nextStatus || statusMutation.isPending}
                isLoading={statusMutation.isPending && statusMutation.variables === nextStatus}
              >
                Update status
              </Button>
            </form>

            {!isClosed && (
              <Button
                className="mt-3"
                fullWidth
                onClick={() => statusMutation.mutate("resolved")}
                isLoading={
                  statusMutation.isPending &&
                  statusMutation.variables === "resolved" &&
                  nextStatus !== "resolved"
                }
                disabled={statusMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4" /> Mark as resolved
              </Button>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
              Assignment
            </h3>
            <p className="text-sm text-canopy-600 dark:text-canopy-300">
              {report.assignedTo ? (
                <>
                  Assigned to{" "}
                  <span className="font-semibold text-canopy-800 dark:text-canopy-100">
                    {isAssignedToMe ? "you" : report.assignedTo.name}
                  </span>
                </>
              ) : (
                "Not assigned to an officer yet."
              )}
            </p>

            {mode === "officer" && !isAssignedToMe && currentUser && (
              <Button
                variant="secondary"
                fullWidth
                className="mt-4"
                onClick={() => assignMutation.mutate(currentUser.id)}
                isLoading={assignMutation.isPending}
              >
                <UserPlus className="h-4 w-4" /> Assign to me
              </Button>
            )}

            {mode === "admin" && (
              <form
                className="mt-4 flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedOfficer) assignMutation.mutate(selectedOfficer);
                }}
              >
                <label
                  htmlFor="assign-officer"
                  className="text-sm font-medium text-canopy-700 dark:text-canopy-200"
                >
                  {report.assignedTo ? "Reassign to" : "Assign environmental officer"}
                </label>
                <select
                  id="assign-officer"
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  className={fieldClass}
                  disabled={activeOfficers.length === 0}
                >
                  <option value="" disabled>
                    {activeOfficers.length === 0
                      ? "No active officers available"
                      : "Select an officer"}
                  </option>
                  {activeOfficers
                    .filter((o) => o.id !== report.assignedTo?.id)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                </select>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={!selectedOfficer}
                  isLoading={assignMutation.isPending}
                >
                  <UserPlus className="h-4 w-4" /> Assign
                </Button>
              </form>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
              Details
            </h3>
            <dl className="space-y-3 text-sm">
              <DetailRow
                icon={Calendar}
                label="Submitted"
                value={new Date(report.createdAt).toLocaleString()}
              />
              <DetailRow
                icon={Clock}
                label="Last updated"
                value={new Date(report.updatedAt).toLocaleString()}
              />
              <DetailRow icon={User} label="Reported by" value={report.reportedBy.name} />
            </dl>
          </section>

          {mode === "admin" && (
            <section className="card p-5 sm:p-6">
              <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
                <History className="h-4 w-4" /> Activity
              </h3>
              {isActivityLoading && <Skeleton className="h-16 w-full" />}
              {!isActivityLoading && (activity ?? []).length === 0 && (
                <p className="text-sm text-canopy-400 dark:text-canopy-500">
                  No status or assignment changes recorded yet.
                </p>
              )}
              <ol className="space-y-3">
                {(activity ?? []).map((entry) => (
                  <li
                    key={entry.id}
                    className="border-l-2 border-canopy-100 pl-3 dark:border-canopy-700"
                  >
                    <p className="text-sm text-canopy-700 dark:text-canopy-200">
                      <span className="font-semibold">{entry.actorName}</span>{" "}
                      {describeActivity(entry, officerNameById)}
                    </p>
                    <p className="text-xs text-canopy-400 dark:text-canopy-500">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function describeActivity(entry: AuditLogEntry, officerNameById: Map<string, string>): string {
  if (entry.action === "assign_report") {
    const officerId = entry.metadata?.officerId;
    return `assigned it to ${(officerId && officerNameById.get(officerId)) || "an officer"}`;
  }
  if (entry.action === "update_status") {
    const status = entry.metadata?.status as ReportStatus | undefined;
    return `changed status to ${status && statusLabels[status] ? statusLabels[status].toLowerCase() : "a new value"}`;
  }
  return entry.action.replace(/_/g, " ");
}

function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-canopy-600 hover:text-canopy-800 dark:text-canopy-300 dark:hover:text-canopy-100"
    >
      <ArrowLeft className="h-4 w-4" /> Back to reports
    </Link>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-canopy-400" />
      <div>
        <dt className="text-xs text-canopy-400 dark:text-canopy-500">{label}</dt>
        <dd className="text-canopy-700 dark:text-canopy-200">{value}</dd>
      </div>
    </div>
  );
}
