"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { getSystemSettings, updateSystemSettings, type SystemSettings } from "@/lib/api/system-settings";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "settings"], queryFn: getSystemSettings });

  const { register, handleSubmit, reset } = useForm<SystemSettings>();

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin", "settings"], updated);
      toast.success("Settings saved");
    },
    onError: () => toast.error("Couldn't save settings")
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <span className="eyebrow mb-1 block">Configuration</span>
        <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">System settings</h2>
      </div>

      <form className="card flex flex-col gap-5 p-8" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Input label="Site name" {...register("siteName")} />
        <Input label="Support email" type="email" {...register("supportEmail")} />
        <Input
          label="Resolution SLA (hours)"
          type="number"
          {...register("reportResolutionSlaHours", { valueAsNumber: true })}
        />
        <Checkbox label="Automatically assign new reports to the nearest officer" {...register("autoAssignReports")} />
        <Checkbox label="Allow citizens to submit reports without email verification" {...register("allowPublicReportSubmission")} />

        <Button type="submit" isLoading={mutation.isPending}>
          Save settings
        </Button>
      </form>
    </div>
  );
}
