"use client";

import { useState } from "react";
import { LayoutDashboard, BarChart3, UserCircle, Settings } from "lucide-react";
import { DashboardSidebar, type SidebarLink } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { useCurrentUser } from "@/hooks/use-current-user";

const links: SidebarLink[] = [
  { href: "/officer", label: "Report queue", icon: LayoutDashboard },
  { href: "/officer/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useCurrentUser();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-mist/40 dark:bg-canopy-800/40">
      <DashboardSidebar
        links={links}
        roleLabel="Environmental Officer"
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />
      <div className="flex flex-1 flex-col">
        <DashboardTopbar
          title="Report queue"
          userName={user?.name ?? "Officer"}
          onMenuClick={() => setIsMobileNavOpen(true)}
        />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
