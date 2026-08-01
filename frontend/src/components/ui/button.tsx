import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", isLoading = false, fullWidth = false, className, children, disabled, ...props },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-moss disabled:cursor-not-allowed disabled:opacity-60";

    const variants: Record<string, string> = {
      primary: "bg-canopy-700 text-paper hover:bg-canopy-600",
      secondary: "border border-canopy-200 dark:border-canopy-600 text-canopy-700 dark:text-canopy-200 hover:border-canopy-700",
      ghost: "text-canopy-600 dark:text-canopy-300 hover:text-canopy-800 dark:hover:text-canopy-100"
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(base, variants[variant], fullWidth && "w-full", className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
