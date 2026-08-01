import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-canopy-700 dark:text-canopy-200">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={clsx(
            "rounded-xl border bg-paper dark:bg-canopy-800 px-4 py-2.5 text-sm text-canopy-800 dark:text-canopy-100 outline-none transition-colors placeholder:text-canopy-300 dark:placeholder:text-canopy-600",
            "focus:border-moss focus:ring-2 focus:ring-moss/20",
            error ? "border-alert-clay" : "border-canopy-100 dark:border-canopy-700",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="text-xs font-medium text-alert-clay">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-canopy-400 dark:text-canopy-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
