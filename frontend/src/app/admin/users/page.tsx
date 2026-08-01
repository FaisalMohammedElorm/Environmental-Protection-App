"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Search, Users } from "lucide-react";

import { getUsers, setUserActive, setUserRole } from "@/lib/api/admin-users";
import type { UserRole } from "@/types/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const roleFilters: Array<{ value: UserRole | "all"; label: string }> = [
  { value: "all", label: "All roles" },
  { value: "citizen", label: "Citizens" },
  { value: "officer", label: "Officers" },
  { value: "admin", label: "Admins" }
];

export default function AdminUsersPage() {
  const [role, setRole] = useState<UserRole | "all">("all");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "users", { role, search }],
    queryFn: () => getUsers({ role: role === "all" ? undefined : role, search: search || undefined, page: 1, limit: 25 })
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setUserActive(id, isActive),
    onSuccess: () => {
      toast.success("User updated");
      invalidate();
    },
    onError: () => toast.error("Couldn't update that user")
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role: newRole }: { id: string; role: string }) => setUserRole(id, newRole),
    onSuccess: () => {
      toast.success("Role updated");
      invalidate();
    },
    onError: () => toast.error("Couldn't change that role")
  });

  const users = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow mb-1 block">User management</span>
          <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">All users</h2>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-canopy-300 dark:text-canopy-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-64 rounded-xl border border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 py-2 pl-9 pr-3 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {roleFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setRole(f.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              role === f.value ? "bg-canopy-700 text-paper" : "border border-canopy-100 dark:border-canopy-700 text-canopy-600 dark:text-canopy-300 hover:border-canopy-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {!isLoading && (isError || users.length === 0) && (
        <EmptyState icon={Users} title="No users found" description="Try a different search or role filter." />
      )}

      {!isLoading && users.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
            <thead className="border-b border-canopy-100 dark:border-canopy-700 bg-mist/60 dark:bg-canopy-800/60">
              <tr>
                <th className="px-6 py-3 font-medium text-canopy-500 dark:text-canopy-400">Name</th>
                <th className="px-6 py-3 font-medium text-canopy-500 dark:text-canopy-400">Email</th>
                <th className="px-6 py-3 font-medium text-canopy-500 dark:text-canopy-400">Role</th>
                <th className="px-6 py-3 font-medium text-canopy-500 dark:text-canopy-400">Status</th>
                <th className="px-6 py-3 font-medium text-canopy-500 dark:text-canopy-400">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-canopy-100 dark:border-canopy-700 last:border-0">
                  <td className="px-6 py-3 font-medium text-canopy-800 dark:text-canopy-100">{u.name}</td>
                  <td className="px-6 py-3 text-canopy-500 dark:text-canopy-400">{u.email}</td>
                  <td className="px-6 py-3">
                    <select
                      defaultValue={u.role}
                      onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                      className="rounded-lg border border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 px-2 py-1 text-xs capitalize"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="officer">Officer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => statusMutation.mutate({ id: u.id, isActive: !u.isActive })}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        u.isActive ? "bg-moss/10 text-moss-dark" : "bg-alert-clay/10 text-alert-clay"
                      }`}
                    >
                      {u.isActive ? "Active" : "Suspended"}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-canopy-400 dark:text-canopy-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
}
