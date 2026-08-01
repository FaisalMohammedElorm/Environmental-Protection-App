"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

import { getUsers } from "@/lib/api/admin-users";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminOfficersPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "users", { role: "officer" }],
    queryFn: () => getUsers({ role: "officer", page: 1, limit: 50 })
  });

  const officers = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="eyebrow mb-1 block">Environmental officers</span>
        <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">Officer roster</h2>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && (isError || officers.length === 0) && (
        <EmptyState
          icon={ShieldCheck}
          title="No officers yet"
          description="Promote a citizen account to officer from the Users page to see them here."
        />
      )}

      {!isLoading && officers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {officers.map((o) => (
            <div key={o.id} className="card p-6">
              <p className="font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">{o.name}</p>
              <p className="text-xs text-canopy-400 dark:text-canopy-500">{o.email}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-canopy-100 dark:border-canopy-700 pt-4">
                <div>
                  <p className="eyebrow mb-1">Filed</p>
                  <p className="font-mono text-lg font-medium text-canopy-800 dark:text-canopy-100">{o.reportsFiled ?? 0}</p>
                </div>
                <div>
                  <p className="eyebrow mb-1">Resolved</p>
                  <p className="font-mono text-lg font-medium text-canopy-800 dark:text-canopy-100">{o.reportsResolved ?? 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
