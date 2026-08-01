import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="flex items-start gap-2.5 text-sm text-canopy-600 dark:text-canopy-300">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            aria-invalid={Boolean(error)}
            className={clsx(
              "mt-0.5 h-4 w-4 rounded border-canopy-200 dark:border-canopy-600 text-moss focus:ring-2 focus:ring-moss/30",
              className
            )}
            {...props}
          />
          <span>{label}</span>
        </label>
        {error && <p className="text-xs font-medium text-alert-clay">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
