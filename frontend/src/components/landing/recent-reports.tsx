import { recentReports, type ReportSeverity } from "@/lib/mock-data";

const severityStyles: Record<ReportSeverity, string> = {
  low: "bg-moss/10 text-moss-dark",
  moderate: "bg-alert-amber/10 text-alert-amber",
  high: "bg-alert-amber/15 text-alert-amber",
  critical: "bg-alert-clay/10 text-alert-clay"
};

const statusStyles: Record<string, string> = {
  new: "text-canopy-500 dark:text-canopy-400",
  assigned: "text-alert-amber",
  resolved: "text-moss-dark"
};

export function RecentReports() {
  return (
    <section id="reports" className="container-app py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <span className="eyebrow mb-3 block">Live feed</span>
          <h2 className="text-3xl font-semibold text-canopy-800 dark:text-canopy-100 sm:text-4xl">Reports coming in now</h2>
        </div>
        <span className="font-mono text-xs text-canopy-400 dark:text-canopy-500">Updated every 60 seconds</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-canopy-100 dark:border-canopy-700 bg-mist/60 dark:bg-canopy-800/60">
            <tr>
              <th className="px-6 py-4 font-medium text-canopy-500 dark:text-canopy-400">ID</th>
              <th className="px-6 py-4 font-medium text-canopy-500 dark:text-canopy-400">Category</th>
              <th className="px-6 py-4 font-medium text-canopy-500 dark:text-canopy-400">Location</th>
              <th className="px-6 py-4 font-medium text-canopy-500 dark:text-canopy-400">Severity</th>
              <th className="px-6 py-4 font-medium text-canopy-500 dark:text-canopy-400">Status</th>
              <th className="px-6 py-4 font-medium text-canopy-500 dark:text-canopy-400">Filed</th>
            </tr>
          </thead>
          <tbody>
            {recentReports.map((report) => (
              <tr key={report.id} className="border-b border-canopy-100 dark:border-canopy-700 last:border-0">
                <td className="px-6 py-4 font-mono text-xs text-canopy-500 dark:text-canopy-400">{report.id}</td>
                <td className="px-6 py-4 font-medium text-canopy-800 dark:text-canopy-100">{report.category}</td>
                <td className="px-6 py-4 text-canopy-500 dark:text-canopy-400">
                  {report.location}
                  <span className="ml-2 font-mono text-xs text-canopy-300 dark:text-canopy-600">{report.coords}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${severityStyles[report.severity]}`}
                  >
                    {report.severity}
                  </span>
                </td>
                <td className={`px-6 py-4 font-medium capitalize ${statusStyles[report.status]}`}>
                  {report.status}
                </td>
                <td className="px-6 py-4 text-canopy-400 dark:text-canopy-500">{report.reportedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  );
}
