import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon?: LucideIcon;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
  isLoading?: boolean;
}

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-mist dark:bg-canopy-700 text-canopy-600 dark:text-canopy-300",
  warning: "bg-alert-amber/10 text-alert-amber",
  danger: "bg-alert-clay/10 text-alert-clay",
  success: "bg-moss/15 text-moss-dark dark:text-moss-light"
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  isLoading
}: StatCardProps) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow mb-2">{label}</p>
        {Icon && (
          <span
            className={clsx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              toneStyles[tone]
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="mt-1 h-9 w-16" />
      ) : (
        <p className="font-display text-3xl font-semibold text-canopy-800 dark:text-canopy-100">
          {value ?? "—"}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-canopy-400 dark:text-canopy-500">{hint}</p>}
    </div>
  );
}
