"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import clsx from "clsx";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  // next-themes can't know the persisted theme during server render, so the
  // first client render must match the server to avoid a hydration mismatch —
  // render a neutral placeholder until mounted, then swap to the real icon.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span
        className={clsx("flex h-9 w-9 items-center justify-center rounded-full", className)}
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={clsx(
        "flex h-9 w-9 items-center justify-center rounded-full border border-canopy-200 text-canopy-600 transition-colors hover:border-canopy-700 hover:text-canopy-800",
        "dark:border-canopy-600 dark:text-canopy-300 dark:hover:border-canopy-300 dark:hover:text-canopy-100",
        className
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
