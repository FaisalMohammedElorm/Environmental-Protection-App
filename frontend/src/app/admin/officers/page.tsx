"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowUpRight, Search, ShieldCheck } from "lucide-react";

import { getUsers, setUserActive } from "@/lib/api/admin-users";
import { getOpenAssignmentCounts } from "@/lib/api/reports";
import type { AdminUser } from "@/types/admin-user";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

const th = "px-4 py-3 font-medium text-canopy-500 dark:text-canopy-400 whitespace-nowrap";

export default function AdminOfficersPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "users", { role: "officer", search }],
    queryFn: () =>
      getUsers({ role: "officer", search: search.trim() || undefined, page: 1, limit: 100 })
  });

  const officers = data?.items ?? [];
  const officerIds = officers.map((o) => o.id);

  const { data: workload, isPending: isWorkloadPending } = useQuery({
    queryKey: ["admin", "officer-workload", officerIds],
    queryFn: () => getOpenAssignmentCounts(officerIds),
    enabled: officerIds.length > 0
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setUserActive(id, isActive),
    onSuccess: (updated) => {
      toast.success(`${updated.name} ${updated.isActive ? "activated" : "deactivated"}`);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("Couldn't update that officer")
  });

  const renderWorkload = (o: AdminUser) =>
    isWorkloadPending ? (
      <Skeleton className="h-4 w-6" />
    ) : (
      <span className="font-mono">{workload?.[o.id] ?? 0}</span>
    );

  const renderToggle = (o: AdminUser) => (
    <button
      onClick={() => statusMutation.mutate({ id: o.id, isActive: !o.isActive })}
      disabled={statusMutation.isPending}
      className="whitespace-nowrap rounded-full border border-canopy-100 px-3 py-1.5 text-xs font-semibold text-canopy-600 hover:border-canopy-700 disabled:opacity-50 dark:border-canopy-700 dark:text-canopy-300 dark:hover:border-canopy-300"
    >
      {o.isActive ? "Deactivate" : "Activate"}
    </button>
  );

  const renderReportsLink = (o: AdminUser) => (
    <Link
      href={`/admin/reports?officer=${o.id}`}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-canopy-100 px-3 py-1.5 text-xs font-semibold text-canopy-700 hover:border-canopy-700 dark:border-canopy-700 dark:text-canopy-200 dark:hover:border-canopy-300"
    >
      Assigned reports <ArrowUpRight className="h-3.5 w-3.5" />
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow mb-1 block">Environmental officers</span>
          <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">
            Officer roster
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-canopy-500 dark:text-canopy-400">
            Monitor officer workload and availability. Promote a citizen to officer from the Users
            page.
          </p>
        </div>
        <label className="relative w-full sm:w-64">
          <span className="sr-only">Search officers</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-canopy-300 dark:text-canopy-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-xl border border-canopy-100 bg-paper py-2 pl-9 pr-3 text-sm text-canopy-800 outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 dark:border-canopy-700 dark:bg-canopy-800 dark:text-canopy-100"
          />
        </label>
      </div>

      {isPending && (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {isError && <ErrorState title="Couldn't load officers" onRetry={() => refetch()} />}

      {!isPending && !isError && officers.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          title={search ? "No officers match" : "No officers yet"}
          description={
            search
              ? "Try a different name or email."
              : "Promote a citizen account to officer from the Users page to see them here."
          }
          actionHref={search ? undefined : "/admin/users"}
          actionLabel={search ? undefined : "Go to Users"}
        />
      )}

      {!isPending && !isError && officers.length > 0 && (
        <>
          {/* Desktop / tablet */}
          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-canopy-100 bg-mist/60 dark:border-canopy-700 dark:bg-canopy-800/60">
                  <tr>
                    <th className={th}>Officer</th>
                    <th className={th}>Status</th>
                    <th className={th}>Open assignments</th>
                    <th className={th}>Resolved</th>
                    <th className={th}>Joined</th>
                    <th className={`${th} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-canopy-100 last:border-0 dark:border-canopy-700"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-canopy-800 dark:text-canopy-100">{o.name}</p>
                        <p className="text-xs text-canopy-400 dark:text-canopy-500">{o.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <ActiveBadge isActive={o.isActive} />
                      </td>
                      <td className="px-4 py-3 text-canopy-700 dark:text-canopy-200">
                        {renderWorkload(o)}
                      </td>
                      <td className="px-4 py-3 font-mono text-canopy-700 dark:text-canopy-200">
                        {o.reportsResolved ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-canopy-400 dark:text-canopy-500">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {renderReportsLink(o)}
                          {renderToggle(o)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {officers.map((o) => (
              <div key={o.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-canopy-800 dark:text-canopy-100">{o.name}</p>
                    <p className="truncate text-xs text-canopy-400 dark:text-canopy-500">
                      {o.email}
                    </p>
                  </div>
                  <ActiveBadge isActive={o.isActive} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-canopy-100 pt-3 text-sm dark:border-canopy-700">
                  <div>
                    <p className="eyebrow mb-1">Open</p>
                    <div className="text-canopy-800 dark:text-canopy-100">{renderWorkload(o)}</div>
                  </div>
                  <div>
                    <p className="eyebrow mb-1">Resolved</p>
                    <p className="font-mono text-canopy-800 dark:text-canopy-100">
                      {o.reportsResolved ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow mb-1">Joined</p>
                    <p className="text-xs text-canopy-500 dark:text-canopy-400">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {renderReportsLink(o)}
                  {renderToggle(o)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isActive
          ? "bg-moss/10 text-moss-dark dark:text-moss-light"
          : "bg-alert-clay/10 text-alert-clay"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
