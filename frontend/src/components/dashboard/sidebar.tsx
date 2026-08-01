"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Leaf, X, type LucideIcon } from "lucide-react";

export interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardSidebarProps {
  links: SidebarLink[];
  roleLabel: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function SidebarContent({
  links,
  roleLabel,
  pathname,
  onNavigate
}: {
  links: SidebarLink[];
  roleLabel: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-canopy-100 dark:border-canopy-700 px-6 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canopy-700 text-paper">
          <Leaf className="h-4 w-4" strokeWidth={2.25} />
        </span>
        EcoAlert
      </div>

      <p className="eyebrow px-6 pt-6">{roleLabel}</p>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-canopy-700 text-paper"
                  : "text-canopy-600 dark:text-canopy-300 hover:bg-mist dark:hover:bg-canopy-800 hover:text-canopy-800 dark:hover:text-canopy-100"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function DashboardSidebar({ links, roleLabel, isMobileOpen, onCloseMobile }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: permanent sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 lg:flex">
        <SidebarContent links={links} roleLabel={roleLabel} pathname={pathname} />
      </aside>

      {/* Mobile: slide-out drawer, triggered by the topbar's menu button */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-canopy-900/50" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="fixed inset-y-0 left-0 flex w-72 flex-col border-r border-canopy-100 bg-paper dark:border-canopy-700 dark:bg-canopy-800">
            <button
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="absolute right-3 top-4 text-canopy-500 dark:text-canopy-300"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent links={links} roleLabel={roleLabel} pathname={pathname} onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
