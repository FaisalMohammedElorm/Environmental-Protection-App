"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";

import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api/notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", { page: 1 }],
    queryFn: () => getNotifications(1)
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  const notifications = data?.items ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="eyebrow mb-1 block">Inbox</span>
          <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">Notifications</h2>
        </div>
        <button
          onClick={() => markAll.mutate()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-canopy-700 dark:text-canopy-200 hover:text-canopy-800 dark:hover:text-canopy-100"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Updates on your reports — status changes, assignments, comments — will land here."
        />
      )}

      {!isLoading && notifications.length > 0 && (
        <div className="card divide-y divide-canopy-100 dark:divide-canopy-700">
          {notifications.map((n) => {
            const content = (
              <div
                className={`flex items-start gap-3 px-6 py-4 ${!n.isRead ? "bg-mist/40 dark:bg-canopy-800/40" : ""}`}
                onClick={() => !n.isRead && markRead.mutate(n.id)}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.isRead ? "bg-moss" : "bg-transparent"}`} />
                <div>
                  <p className="text-sm font-semibold text-canopy-800 dark:text-canopy-100">{n.title}</p>
                  <p className="mt-0.5 text-sm text-canopy-600 dark:text-canopy-300">{n.body}</p>
                  <p className="mt-1 text-xs text-canopy-300 dark:text-canopy-600">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
            );

            return n.relatedReportId ? (
              <Link key={n.id} href={`/dashboard/reports/${n.relatedReportId}`} className="block hover:bg-mist/60 dark:hover:bg-canopy-800/60">
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
