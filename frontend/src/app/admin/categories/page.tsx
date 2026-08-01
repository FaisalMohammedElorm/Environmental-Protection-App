"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Trash2, Tags } from "lucide-react";

import { createCategory, deleteCategory, getCategories, updateCategory } from "@/lib/api/categories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminCategoriesPage() {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success("Category added");
      setName("");
      invalidate();
    },
    onError: () => toast.error("Couldn't add that category")
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateCategory(id, { isActive }),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't update that category")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success("Category removed");
      invalidate();
    },
    onError: () => toast.error("Couldn't remove that category")
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="eyebrow mb-1 block">Taxonomy</span>
        <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">Report categories</h2>
      </div>

      <form
        className="card flex flex-wrap items-end gap-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createMutation.mutate({ name: name.trim() });
        }}
      >
        <div className="min-w-[240px] flex-1">
          <Input label="New category name" placeholder="e.g. Noise pollution" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit" isLoading={createMutation.isPending}>
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </form>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {!isLoading && (!categories || categories.length === 0) && (
        <EmptyState icon={Tags} title="No categories yet" description="Add your first category above." />
      )}

      {!isLoading && categories && categories.length > 0 && (
        <div className="card divide-y divide-canopy-100 dark:divide-canopy-700">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="font-medium text-canopy-800 dark:text-canopy-100">{c.name}</p>
                <p className="text-xs text-canopy-400 dark:text-canopy-500">
                  {c.reportCount ?? 0} reports · /{c.slug}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleMutation.mutate({ id: c.id, isActive: !c.isActive })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    c.isActive ? "bg-moss/10 text-moss-dark" : "bg-canopy-100 dark:bg-canopy-700 text-canopy-500 dark:text-canopy-400"
                  }`}
                >
                  {c.isActive ? "Active" : "Hidden"}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(c.id)}
                  aria-label={`Delete ${c.name}`}
                  className="text-canopy-400 dark:text-canopy-500 hover:text-alert-clay"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
