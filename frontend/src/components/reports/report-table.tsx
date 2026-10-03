"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

import { formatCategoryLabel, type Report } from "@/types/report";
import { StatusBadge, SeverityBadge } from "@/components/dashboard/badges";

interface ReportTableProps {
  reports: Report[];
  /** Detail page for a report, e.g. (id) => `/officer/reports/${id}`. */
  detailHref: (id: string) => string;
  showAssignee?: boolean;
  /** Extra per-row controls (e.g. quick triage buttons), shown beside "View". */
  renderActions?: (report: Report) => ReactNode;
}

export function shortReportId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

const th = "px-4 py-3 font-medium text-canopy-500 dark:text-canopy-400 whitespace-nowrap";

export function ReportTable({
  reports,
  detailHref,
  showAssignee,
  renderActions
}: ReportTableProps) {
  return (
    <>
      {/* Desktop / tablet: table */}
      <div className="card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-canopy-100 bg-mist/60 dark:border-canopy-700 dark:bg-canopy-800/60">
              <tr>
                <th className={th}>Report</th>
                <th className={th}>Category</th>
                <th className={th}>Location</th>
                <th className={th}>Submitted</th>
                <th className={th}>Severity</th>
                <th className={th}>Status</th>
                {showAssignee && <th className={th}>Assigned to</th>}
                <th className={`${th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-canopy-100 last:border-0 hover:bg-mist/40 dark:border-canopy-700 dark:hover:bg-canopy-700/30"
                >
                  <td className="px-4 py-3 font-mono text-xs text-canopy-500 dark:text-canopy-400">
                    #{shortReportId(report.id)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-canopy-800 dark:text-canopy-100">
                    {formatCategoryLabel(report.category)}
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-canopy-500 dark:text-canopy-400">
                    <span className="line-clamp-2">{report.location.address}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-canopy-500 dark:text-canopy-400">
                    {formatDate(report.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={report.severity} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={report.status} />
                  </td>
                  {showAssignee && (
                    <td className="whitespace-nowrap px-4 py-3 text-canopy-600 dark:text-canopy-300">
                      {report.assignedTo?.name ?? (
                        <span className="text-canopy-300 dark:text-canopy-600">Unassigned</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {renderActions?.(report)}
                      <Link
                        href={detailHref(report.id)}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-canopy-100 px-3 py-1.5 text-xs font-semibold text-canopy-700 hover:border-canopy-700 dark:border-canopy-700 dark:text-canopy-200 dark:hover:border-canopy-300"
                      >
                        View <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {reports.map((report) => (
          <div key={report.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-canopy-400 dark:text-canopy-500">
                  #{shortReportId(report.id)}
                </p>
                <p className="font-medium text-canopy-800 dark:text-canopy-100">
                  {formatCategoryLabel(report.category)}
                </p>
              </div>
              <StatusBadge status={report.status} />
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-canopy-500 dark:text-canopy-400">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{report.location.address}</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-canopy-400 dark:text-canopy-500">
              <SeverityBadge severity={report.severity} />
              <span>{formatDate(report.createdAt)}</span>
              {showAssignee && <span>· {report.assignedTo?.name ?? "Unassigned"}</span>}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-canopy-100 pt-3 dark:border-canopy-700">
              {renderActions?.(report)}
              <Link
                href={detailHref(report.id)}
                className="inline-flex items-center gap-1 rounded-full border border-canopy-100 px-3 py-1.5 text-xs font-semibold text-canopy-700 dark:border-canopy-700 dark:text-canopy-200"
              >
                View <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="inline-flex items-center gap-1 text-sm font-medium text-canopy-600 disabled:opacity-40 dark:text-canopy-300"
      >
        <ChevronLeft className="h-4 w-4" /> Previous
      </button>
      <span className="text-xs text-canopy-400 dark:text-canopy-500">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex items-center gap-1 text-sm font-medium text-canopy-600 disabled:opacity-40 dark:text-canopy-300"
      >
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
