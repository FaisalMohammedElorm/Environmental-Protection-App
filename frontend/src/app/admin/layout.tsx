"use client";

import { useState } from "react";
import { BarChart3, Users, ShieldCheck, Tags, ScrollText, Settings } from "lucide-react";
import { DashboardSidebar, type SidebarLink } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { useCurrentUser } from "@/hooks/use-current-user";

const links: SidebarLink[] = [
  { href: "/admin", label: "Analytics", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/officers", label: "Officers", icon: ShieldCheck },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/audit-logs", label: "Audit logs", icon: ScrollText },
  { href: "/admin/settings", label: "System settings", icon: Settings }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useCurrentUser();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-mist/40 dark:bg-canopy-800/40">
      <DashboardSidebar
        links={links}
        roleLabel="Administrator"
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />
      <div className="flex flex-1 flex-col">
        <DashboardTopbar
          title="Admin"
          userName={user?.name ?? "Admin"}
          onMenuClick={() => setIsMobileNavOpen(true)}
        />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
