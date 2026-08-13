"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Bell, LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logout } from "@/lib/api/auth";

interface DashboardTopbarProps {
  title: string;
  userName: string;
  onMenuClick?: () => void;
}

export function DashboardTopbar({ title, userName, onMenuClick }: DashboardTopbarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      // Clears every cached query, not just ["auth", "me"] — otherwise a
      // different user signing in on the same tab could briefly see the
      // previous account's cached report/admin data before it refetches.
      queryClient.clear();
      router.push("/login");
    } catch {
      toast.error("Could not log out — try again");
      setIsLoggingOut(false);
    }
  }

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
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-canopy-700 text-xs font-semibold text-paper"
            aria-label="Account menu"
            aria-expanded={isMenuOpen}
          >
            {initials}
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 py-2 shadow-lg">
                <p className="truncate px-4 py-1.5 text-sm font-medium text-canopy-800 dark:text-canopy-100">{userName}</p>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-canopy-600 dark:text-canopy-300 hover:bg-mist dark:hover:bg-canopy-700 hover:text-canopy-800 dark:hover:text-canopy-100 disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" strokeWidth={2} />
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
