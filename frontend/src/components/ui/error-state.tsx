import { AlertTriangle, RotateCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Check your connection and try again.",
  onRetry
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-2xl border border-dashed border-alert-clay/40 bg-paper px-6 py-12 text-center dark:bg-canopy-800"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-alert-clay/10 text-alert-clay">
        <AlertTriangle className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-canopy-500 dark:text-canopy-400">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-6 px-5 py-2">
          <RotateCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}
