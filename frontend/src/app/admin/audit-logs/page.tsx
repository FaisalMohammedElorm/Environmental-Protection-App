"use client";

import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";

import { getAuditLogs } from "@/lib/api/audit-logs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function AuditLogsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => getAuditLogs(1)
  });

  const logs = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="eyebrow mb-1 block">System history</span>
        <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">Audit logs</h2>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {!isLoading && (isError || logs.length === 0) && (
        <EmptyState icon={ScrollText} title="No activity recorded" description="Actions taken by admins and officers will appear here." />
      )}

      {!isLoading && logs.length > 0 && (
        <div className="card divide-y divide-canopy-100 dark:divide-canopy-700">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="text-sm text-canopy-800 dark:text-canopy-100">
                  <span className="font-semibold">{log.actorName}</span>{" "}
                  <span className="text-canopy-500 dark:text-canopy-400">
                    {log.action} {log.targetType} #{log.targetId}
                  </span>
                </p>
                <p className="text-xs capitalize text-canopy-400 dark:text-canopy-500">{log.actorRole}</p>
              </div>
              <span className="font-mono text-xs text-canopy-300 dark:text-canopy-600">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
