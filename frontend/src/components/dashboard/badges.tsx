import clsx from "clsx";
import { statusLabels, type ReportSeverity, type ReportStatus } from "@/types/report";

const statusStyles: Record<ReportStatus, string> = {
  new: "bg-canopy-100 dark:bg-canopy-700 text-canopy-600 dark:text-canopy-300",
  under_review: "bg-alert-amber/10 text-alert-amber",
  assigned: "bg-alert-amber/15 text-alert-amber",
  in_progress: "bg-moss/10 text-moss-dark dark:text-moss-light",
  resolved: "bg-moss/20 text-moss-dark dark:text-moss-light",
  rejected: "bg-alert-clay/10 text-alert-clay"
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", statusStyles[status])}>
      {statusLabels[status]}
    </span>
  );
}

const severityStyles: Record<ReportSeverity, string> = {
  low: "bg-moss/10 text-moss-dark dark:text-moss-light",
  moderate: "bg-alert-amber/10 text-alert-amber",
  high: "bg-alert-amber/15 text-alert-amber",
  critical: "bg-alert-clay/10 text-alert-clay"
};

export function SeverityBadge({ severity }: { severity: ReportSeverity }) {
  return (
    <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold capitalize", severityStyles[severity])}>
      {severity}
    </span>
  );
}
