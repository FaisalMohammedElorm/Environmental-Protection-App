"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { MapPin, Calendar, Send, UserPlus } from "lucide-react";

import { getReportById, addComment, updateReportStatus, assignReport } from "@/lib/api/reports";
import { formatCategoryLabel, statusLabels, type ReportStatus } from "@/types/report";
import { StatusBadge, SeverityBadge } from "@/components/dashboard/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";

const statusOptions: Array<{ value: ReportStatus; label: string }> = [
  { value: "under_review", label: statusLabels.under_review },
  { value: "assigned", label: statusLabels.assigned },
  { value: "in_progress", label: statusLabels.in_progress },
  { value: "resolved", label: statusLabels.resolved },
  { value: "rejected", label: statusLabels.rejected }
];

export default function OfficerReportDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: officer } = useCurrentUser();
  const [comment, setComment] = useState("");

  const { data: report, isLoading } = useQuery({
    queryKey: ["reports", params.id],
    queryFn: () => getReportById(params.id)
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["reports", params.id] });
    queryClient.invalidateQueries({ queryKey: ["reports", "all"] });
  };

  const statusMutation = useMutation({
    mutationFn: (next: string) => updateReportStatus(params.id, next),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
    onError: () => toast.error("Couldn't update the status")
  });

  const assignMutation = useMutation({
    mutationFn: () => assignReport(params.id, officer?.id ?? ""),
    onSuccess: () => {
      toast.success("Assigned to you");
      invalidate();
    },
    onError: () => toast.error("Couldn't assign this report")
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => addComment(params.id, body),
    onSuccess: () => {
      setComment("");
      invalidate();
    },
    onError: () => toast.error("Couldn't post that comment")
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) {
    return <p className="text-canopy-500 dark:text-canopy-400">Report not found.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow mb-1 block">{report.id}</span>
          <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">
            {formatCategoryLabel(report.category)}
          </h2>
        </div>
        <div className="flex gap-2">
          <SeverityBadge severity={report.severity} />
          <StatusBadge status={report.status} />
        </div>
      </div>

      {report.images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {report.images.map((src, i) => (
            <div key={src} className="relative aspect-square w-full overflow-hidden rounded-xl">
              <Image src={src} alt={`Evidence ${i + 1}`} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="card p-6">
        <p className="text-sm leading-relaxed text-canopy-700 dark:text-canopy-200">{report.description}</p>
        <div className="mt-4 flex flex-wrap gap-6 border-t border-canopy-100 dark:border-canopy-700 pt-4 text-xs text-canopy-500 dark:text-canopy-400">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {report.location.address}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Filed {new Date(report.createdAt).toLocaleDateString()} by {report.reportedBy.name}
          </span>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-4 p-6">
        <div className="min-w-[220px] flex-1">
          <Select
            label="Update status"
            placeholder="Change status"
            options={statusOptions}
            onChange={(e) => statusMutation.mutate(e.target.value)}
            disabled={statusMutation.isPending}
          />
        </div>
        <Button variant="secondary" onClick={() => assignMutation.mutate()} isLoading={assignMutation.isPending}>
          <UserPlus className="h-4 w-4" />
          {report.assignedTo ? `Assigned to ${report.assignedTo.name}` : "Assign to me"}
        </Button>
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">Updates & comments</h3>
        <div className="card divide-y divide-canopy-100 dark:divide-canopy-700">
          {report.comments.length === 0 && <p className="px-6 py-6 text-sm text-canopy-400 dark:text-canopy-500">No comments yet.</p>}
          {report.comments.map((c) => (
            <div key={c.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-canopy-800 dark:text-canopy-100">{c.authorName}</p>
                <span className="text-xs capitalize text-canopy-400 dark:text-canopy-500">{c.authorRole}</span>
              </div>
              <p className="mt-1 text-sm text-canopy-600 dark:text-canopy-300">{c.body}</p>
              <p className="mt-1 text-xs text-canopy-300 dark:text-canopy-600">{new Date(c.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <form
          className="mt-4 flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (comment.trim()) commentMutation.mutate(comment.trim());
          }}
        >
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a note for the citizen or your team..."
            className="flex-1 rounded-xl border border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 px-4 py-2.5 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
          />
          <Button type="submit" isLoading={commentMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
