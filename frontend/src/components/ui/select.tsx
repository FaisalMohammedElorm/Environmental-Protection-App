import { forwardRef, type SelectHTMLAttributes } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className, ...props }, ref) => {
    const selectId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-sm font-medium text-canopy-700 dark:text-canopy-200">
          {label}
        </label>
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={Boolean(error)}
            defaultValue=""
            className={clsx(
              "w-full appearance-none rounded-xl border bg-paper dark:bg-canopy-800 px-4 py-2.5 pr-10 text-sm text-canopy-800 dark:text-canopy-100 outline-none transition-colors",
              "focus:border-moss focus:ring-2 focus:ring-moss/20",
              error ? "border-alert-clay" : "border-canopy-100 dark:border-canopy-700",
              className
            )}
            {...props}
          >
            <option value="" disabled>
              {placeholder ?? "Select an option"}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-canopy-400 dark:text-canopy-500" />
        </div>
        {error && <p className="text-xs font-medium text-alert-clay">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
