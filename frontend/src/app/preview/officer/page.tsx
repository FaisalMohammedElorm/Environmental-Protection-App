"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  ClipboardList,
  Hourglass,
  Inbox,
  LayoutDashboard,
  Loader,
  Settings,
  UserCircle,
  X
} from "lucide-react";

import type { Report, ReportSeverity, ReportStatus } from "@/types/report";
import { DashboardSidebar, type SidebarLink } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  ReportFilters,
  defaultReportFilters,
  type ReportFilterValues
} from "@/components/reports/report-filters";
import { ReportTable } from "@/components/reports/report-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

// SAMPLE DATA â€” for screenshots only, never shown on the real /officer route.
const OFFICER = { id: "preview-officer", name: "Ama Owusu" };

const links: SidebarLink[] = [
  { href: "/preview/officer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/preview/officer#analytics", label: "Analytics", icon: BarChart3 },
  { href: "/preview/officer#profile", label: "Profile", icon: UserCircle },
  { href: "/preview/officer#settings", label: "Settings", icon: Settings }
];

function sample(
  n: number,
  category: string,
  address: string,
  severity: ReportSeverity,
  status: ReportStatus,
  hoursAgo: number,
  assigned: boolean
): Report {
  const created = new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
  return {
    id: `${n.toString(16).padStart(8, "0")}-0000-4000-8000-000000000000`,
    category,
    description: "Sample report for preview purposes.",
    severity,
    status,
    images: [],
    location: { address, latitude: 5.6, longitude: -0.2 },
    reportedBy: { id: "preview-citizen", name: "Kwesi Boateng" },
    assignedTo: assigned ? OFFICER : undefined,
    comments: [],
    createdAt: created,
    updatedAt: created
  };
}

const sampleReports: Report[] = [
  sample(0x3fa21c09, "illegal_dumping", "Awoshie Junction, Accra", "high", "in_progress", 5, true),
  sample(0x8b1e44d2, "blocked_drain", "Kaneshie Market, Accra", "moderate", "assigned", 9, true),
  sample(0xc47a0b13, "bush_fire", "Weija Hills, Accra", "critical", "under_review", 14, true),
  sample(0x51d9e7a8, "overflowing_bin", "Osu Oxford Street, Accra", "low", "assigned", 26, true),
  sample(0x9e0f3c55, "water_pollution", "Chemu Lagoon, Tema", "high", "in_progress", 40, true),
  sample(0x2c6b8f71, "flooding", "Odawna, Accra", "critical", "resolved", 72, true),
  sample(
    0x7da42e96,
    "tree_cutting",
    "Achimota Forest edge, Accra",
    "moderate",
    "resolved",
    120,
    true
  ),
  sample(0xe3b5d1a4, "air_pollution", "Agbogbloshie, Accra", "high", "new", 2, false),
  sample(0x4a8c6e30, "blocked_drain", "Madina Zongo Junction", "moderate", "new", 3, false),
  sample(0xb91f2d67, "illegal_mining", "Ofankor, Greater Accra", "critical", "new", 7, false),
  sample(0x06e7a9bc, "overflowing_bin", "Dansoman Last Stop", "low", "rejected", 30, false)
];

const severityRank: Record<ReportSeverity, number> = { low: 0, moderate: 1, high: 2, critical: 3 };

const mine = sampleReports.filter((r) => r.assignedTo?.id === OFFICER.id);

type View = "mine" | "queue";

export default function OfficerPreviewPage() {
  const [view, setView] = useState<View>("mine");
  const [filters, setFilters] = useState<Record<View, ReportFilterValues>>({
    mine: defaultReportFilters,
    queue: { ...defaultReportFilters, status: "new" }
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const active = filters[view];

  const count = (s: ReportStatus) => mine.filter((r) => r.status === s).length;
  const stats = {
    open: mine.filter((r) => r.status !== "resolved" && r.status !== "rejected").length,
    notStarted: count("assigned") + count("under_review"),
    inProgress: count("in_progress"),
    resolved: count("resolved"),
    urgent: mine.filter(
      (r) => severityRank[r.severity] >= 2 && r.status !== "resolved" && r.status !== "rejected"
    ).length
  };

  const reports = useMemo(() => {
    const term = active.search.trim().toLowerCase();
    const list = (view === "mine" ? mine : sampleReports).filter(
      (r) =>
        (active.status === "all" || r.status === active.status) &&
        (!active.severity || r.severity === active.severity) &&
        (!active.category || r.category === active.category) &&
        (!term || r.location.address.toLowerCase().includes(term))
    );
    return [...list].sort((a, b) => {
      if (active.sort === "severity-desc")
        return severityRank[b.severity] - severityRank[a.severity];
      if (active.sort === "severity-asc")
        return severityRank[a.severity] - severityRank[b.severity];
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return active.sort === "oldest" ? -diff : diff;
    });
  }, [view, active]);

  return (
    <div className="flex min-h-screen bg-mist/40 dark:bg-canopy-800/40">
      <DashboardSidebar
        links={links}
        roleLabel="Environmental Officer"
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          title="Officer dashboard"
          userName={OFFICER.name}
          onMenuClick={() => setIsMobileNavOpen(true)}
        />
        <main className="flex-1 px-6 py-8">
          <div className="flex flex-col gap-8">
            <header>
              <span className="eyebrow mb-1 block">Welcome back, Ama</span>
              <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100 sm:text-3xl">
                Environmental Officer Dashboard
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-canopy-500 dark:text-canopy-400">
                Monitor, review and respond to environmental reports assigned to you.
              </p>
            </header>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <StatCard
                label="Open assignments"
                value={stats.open}
                icon={ClipboardList}
                hint="Assigned to you, not closed"
              />
              <StatCard
                label="Not started"
                value={stats.notStarted}
                icon={Hourglass}
                tone="warning"
                hint="Assigned or under review"
              />
              <StatCard label="In progress" value={stats.inProgress} icon={Loader} />
              <StatCard
                label="Resolved"
                value={stats.resolved}
                icon={CheckCircle2}
                tone="success"
              />
              <StatCard
                label="Urgent"
                value={stats.urgent}
                icon={AlertTriangle}
                tone="danger"
                hint="High or critical, still open"
              />
            </div>

            <section className="flex flex-col gap-4">
              <div
                role="tablist"
                aria-label="Report views"
                className="flex w-fit gap-1 rounded-full border border-canopy-100 bg-paper p-1 dark:border-canopy-700 dark:bg-canopy-800"
              >
                {(
                  [
                    { value: "mine", label: "Assigned to me" },
                    { value: "queue", label: "Triage queue" }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.value}
                    role="tab"
                    aria-selected={view === tab.value}
                    onClick={() => setView(tab.value)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      view === tab.value
                        ? "bg-canopy-700 text-paper"
                        : "text-canopy-600 hover:text-canopy-800 dark:text-canopy-300 dark:hover:text-canopy-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <p className="text-sm text-canopy-500 dark:text-canopy-400">
                {view === "mine"
                  ? "Reports an administrator assigned to you, or that you took on from the triage queue."
                  : "Every report in the system. Accept new submissions for review, or open one to assign it to yourself."}
              </p>

              <ReportFilters
                key={view}
                value={active}
                onChange={(next) => setFilters((prev) => ({ ...prev, [view]: next }))}
              />

              {reports.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="Nothing here"
                  description="No sample reports match these filters."
                />
              ) : (
                <ReportTable
                  reports={reports}
                  detailHref={() => "/preview/officer"}
                  showAssignee={view === "queue"}
                  renderActions={(report) =>
                    view === "queue" && report.status === "new" ? (
                      <>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => toast("Preview only")}
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => toast("Preview only")}
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    ) : null
                  }
                />
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
