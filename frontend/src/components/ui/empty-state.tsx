import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export function EmptyState({ icon: Icon, title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-canopy-200 dark:border-canopy-600 bg-paper dark:bg-canopy-800 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mist dark:bg-canopy-800 text-canopy-500 dark:text-canopy-400">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-canopy-500 dark:text-canopy-400">{description}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn-primary mt-6">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
