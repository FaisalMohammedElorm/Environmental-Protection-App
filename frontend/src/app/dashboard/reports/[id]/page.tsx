"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { MapPin, Calendar, Send, Pencil, Trash2, X } from "lucide-react";
import { z } from "zod";

import { getReportById, addComment, updateReport, deleteReport } from "@/lib/api/reports";
import { getCategories } from "@/lib/api/categories";
import { formatCategoryLabel } from "@/types/report";
import { StatusBadge, SeverityBadge } from "@/components/dashboard/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const editSchema = z.object({
  category: z.string().min(1, "Choose a category"),
  severity: z.enum(["low", "moderate", "high", "critical"]),
  description: z.string().min(10, "At least 10 characters").max(1000),
  address: z.string().min(3, "Add a location description")
});
type EditFormValues = z.infer<typeof editSchema>;

const severityOptions = [
  { value: "low", label: "Low — no immediate risk" },
  { value: "moderate", label: "Moderate — should be checked soon" },
  { value: "high", label: "High — needs prompt attention" },
  { value: "critical", label: "Critical — immediate danger" }
];

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ["reports", params.id],
    queryFn: () => getReportById(params.id)
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    enabled: isEditing
  });
  const categoryOptions = (categories ?? []).filter((c) => c.isActive).map((c) => ({ value: c.slug, label: c.name }));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EditFormValues>({ resolver: zodResolver(editSchema) });

  const commentMutation = useMutation({
    mutationFn: (body: string) => addComment(params.id, body),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["reports", params.id] });
    },
    onError: () => toast.error("Couldn't post that comment")
  });

  const editMutation = useMutation({
    mutationFn: (values: EditFormValues) => updateReport(params.id, values),
    onSuccess: () => {
      toast.success("Report updated");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["reports", params.id] });
    },
    onError: () => toast.error("Couldn't update that report")
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteReport(params.id),
    onSuccess: () => {
      toast.success("Report deleted");
      queryClient.invalidateQueries({ queryKey: ["reports", "mine"] });
      router.push("/dashboard/reports");
    },
    onError: () => toast.error("Couldn't delete that report")
  });

  function startEditing() {
    if (!report) return;
    reset({
      category: report.category,
      severity: report.severity as EditFormValues["severity"],
      description: report.description,
      address: report.location.address
    });
    setIsEditing(true);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!report) {
    return <p className="text-canopy-500 dark:text-canopy-400">Report not found.</p>;
  }

  const canEdit = report.status === "new";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow mb-1 block">{report.id}</span>
          <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">
            {formatCategoryLabel(report.category)}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={report.severity} />
          <StatusBadge status={report.status} />
          {canEdit && !isEditing && (
            <Button variant="secondary" onClick={startEditing}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {!canEdit && (
        <p className="text-xs text-canopy-400 dark:text-canopy-500">
          This report is already being reviewed, so it can no longer be edited or deleted.
        </p>
      )}

      {isEditing ? (
        <form
          className="card flex flex-col gap-5 p-6"
          onSubmit={handleSubmit((values) => editMutation.mutate(values))}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Category"
              placeholder="Choose a category"
              options={categoryOptions}
              error={errors.category?.message}
              {...register("category")}
            />
            <Select
              label="Severity"
              options={severityOptions}
              error={errors.severity?.message}
              {...register("severity")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-description" className="text-sm font-medium text-canopy-700 dark:text-canopy-200">
              Description
            </label>
            <textarea
              id="edit-description"
              rows={4}
              className="rounded-xl border border-canopy-100 bg-paper px-4 py-2.5 text-sm text-canopy-800 outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 dark:border-canopy-700 dark:bg-canopy-800 dark:text-canopy-100"
              {...register("description")}
            />
            {errors.description && <p className="text-xs font-medium text-alert-clay">{errors.description.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-address" className="text-sm font-medium text-canopy-700 dark:text-canopy-200">
              Location description
            </label>
            <input
              id="edit-address"
              className="rounded-xl border border-canopy-100 bg-paper px-4 py-2.5 text-sm text-canopy-800 outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 dark:border-canopy-700 dark:bg-canopy-800 dark:text-canopy-100"
              {...register("address")}
            />
            {errors.address && <p className="text-xs font-medium text-alert-clay">{errors.address.message}</p>}
          </div>
          <div className="flex gap-3">
            <Button type="submit" isLoading={editMutation.isPending}>
              Save changes
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          {report.images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {report.images.map((src, i) => (
                <div key={src} className="relative aspect-square w-full overflow-hidden rounded-xl">
                  <Image
                    src={src}
                    alt={`Report evidence ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                  />
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
                Filed {new Date(report.createdAt).toLocaleDateString()}
              </span>
              {report.assignedTo && <span>Assigned to {report.assignedTo.name}</span>}
            </div>
          </div>
        </>
      )}

      {canEdit && !isEditing && (
        <div className="card flex items-center justify-between p-4">
          {confirmingDelete ? (
            <>
              <p className="text-sm text-canopy-600 dark:text-canopy-300">Delete this report? This can't be undone.</p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </Button>
                <Button
                  className="!bg-alert-clay hover:!bg-alert-clay/90"
                  onClick={() => deleteMutation.mutate()}
                  isLoading={deleteMutation.isPending}
                >
                  Yes, delete
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-canopy-500 dark:text-canopy-400">Filed this by mistake or want it gone?</p>
              <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
                <Trash2 className="h-4 w-4 text-alert-clay" />
                <span className="text-alert-clay">Delete report</span>
              </Button>
            </>
          )}
        </div>
      )}

      <div>
        <h3 className="mb-3 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">Updates & comments</h3>
        <div className="card divide-y divide-canopy-100 dark:divide-canopy-700">
          {report.comments.length === 0 && (
            <p className="px-6 py-6 text-sm text-canopy-400 dark:text-canopy-500">No comments yet.</p>
          )}
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
            placeholder="Add a comment or ask a question..."
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
