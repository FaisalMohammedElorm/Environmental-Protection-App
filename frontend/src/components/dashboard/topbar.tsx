"use client";

import { Bell, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface DashboardTopbarProps {
  title: string;
  userName: string;
  onMenuClick?: () => void;
}

export function DashboardTopbar({ title, userName, onMenuClick }: DashboardTopbarProps) {
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-canopy-600 dark:text-canopy-300 lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle className="h-8 w-8 border-none hover:border-none" />
        <button className="relative text-canopy-500 dark:text-canopy-400 hover:text-canopy-800 dark:hover:text-canopy-100" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-alert-clay" />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-canopy-700 text-xs font-semibold text-paper">
          {initials}
        </span>
      </div>
    </header>
  );
}
