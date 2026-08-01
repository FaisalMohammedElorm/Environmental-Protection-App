"use client";

import { useState } from "react";
import { LayoutDashboard, FilePlus2, ListChecks, Bell, UserCircle, Settings } from "lucide-react";
import { DashboardSidebar, type SidebarLink } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { useCurrentUser } from "@/hooks/use-current-user";

const links: SidebarLink[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/report/new", label: "Submit a report", icon: FilePlus2 },
  { href: "/dashboard/reports", label: "My reports", icon: ListChecks },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useCurrentUser();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-mist/40 dark:bg-canopy-800/40">
      <DashboardSidebar
        links={links}
        roleLabel="Citizen"
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />
      <div className="flex flex-1 flex-col">
        <DashboardTopbar
          title="Dashboard"
          userName={user?.name ?? "Citizen"}
          onMenuClick={() => setIsMobileNavOpen(true)}
        />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
