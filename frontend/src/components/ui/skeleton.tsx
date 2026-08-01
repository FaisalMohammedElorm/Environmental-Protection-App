import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-lg bg-canopy-100/70 dark:bg-canopy-700/50", className)} />;
}
