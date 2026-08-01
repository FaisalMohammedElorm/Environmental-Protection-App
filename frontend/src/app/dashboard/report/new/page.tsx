"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { LocateFixed, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import { Skeleton } from "@/components/ui/skeleton";
import { createReport } from "@/lib/api/reports";
import { getCategories } from "@/lib/api/categories";
import { reportSchema, type ReportFormValues } from "@/lib/validators/report";

const LocationPicker = dynamic(
  () => import("@/components/ui/location-picker").then((mod) => mod.LocationPicker),
  { ssr: false, loading: () => <Skeleton className="h-[260px] w-full" /> }
);

const severityOptions = [
  { value: "low", label: "Low — no immediate risk" },
  { value: "moderate", label: "Moderate — should be checked soon" },
  { value: "high", label: "High — needs prompt attention" },
  { value: "critical", label: "Critical — immediate danger" }
];

export default function NewReportPage() {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [imagesError, setImagesError] = useState<string>();
  const [isLocating, setIsLocating] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories
  });

  const categoryOptions = (categories ?? [])
    .filter((c) => c.isActive)
    .map((c) => ({ value: c.slug, label: c.name }));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema)
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");

  const mutation = useMutation({
    mutationFn: createReport,
    onSuccess: (report) => {
      toast.success("Report submitted — we'll notify you as it's reviewed");
      router.push(`/dashboard/reports/${report.id}`);
    },
    onError: () => {
      toast.error("Couldn't submit that report. Please try again.")
    }
  });

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Location isn't available in this browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", position.coords.latitude, { shouldValidate: true });
        setValue("longitude", position.coords.longitude, { shouldValidate: true });
        setIsLocating(false);
        toast.success("Location captured");
      },
      () => {
        setIsLocating(false);
        toast.error("Couldn't get your location — check permissions");
      }
    );
  }

  function onSubmit(values: ReportFormValues) {
    if (images.length === 0) {
      setImagesError("Add at least one photo as evidence");
      return;
    }
    setImagesError(undefined);
    mutation.mutate({ ...values, images });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <span className="eyebrow mb-2 block">New report</span>
        <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">
          What did you see, and where?
        </h2>
        <p className="mt-1 text-sm text-canopy-500 dark:text-canopy-400">
          Add a photo and pin the location — the more detail, the faster an officer can act.
        </p>
      </div>

      <form className="card flex flex-col gap-6 p-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 sm:grid-cols-2">
          {categoriesLoading ? (
            <Skeleton className="h-[66px] w-full" />
          ) : (
            <Select
              label="Category"
              placeholder="Choose a category"
              options={categoryOptions}
              error={errors.category?.message}
              {...register("category")}
            />
          )}
          <Select
            label="Severity"
            placeholder="How urgent is it?"
            options={severityOptions}
            error={errors.severity?.message}
            {...register("severity")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-canopy-700 dark:text-canopy-200">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Describe what you saw — size, materials, how long it's been there..."
            className="rounded-xl border border-canopy-100 dark:border-canopy-700 bg-paper dark:bg-canopy-800 px-4 py-2.5 text-sm text-canopy-800 dark:text-canopy-100 outline-none transition-colors placeholder:text-canopy-300 dark:placeholder:text-canopy-600 focus:border-moss focus:ring-2 focus:ring-moss/20"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs font-medium text-alert-clay">{errors.description.message}</p>
          )}
        </div>

        <Input
          label="Location description"
          placeholder="e.g. Behind the Total station, Awoshie"
          error={errors.address?.message}
          {...register("address")}
        />

        <div className="flex items-center justify-between rounded-xl border border-canopy-100 dark:border-canopy-700 bg-mist/40 dark:bg-canopy-800/40 px-4 py-3">
          <div className="text-sm">
            <p className="font-medium text-canopy-700 dark:text-canopy-200">GPS coordinates</p>
            <p className="font-mono text-xs text-canopy-500 dark:text-canopy-400">
              {latitude && longitude ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : "Not captured yet"}
            </p>
            {(errors.latitude || errors.longitude) && (
              <p className="text-xs font-medium text-alert-clay">Capture your location to continue</p>
            )}
          </div>
          <Button type="button" variant="secondary" onClick={useMyLocation} disabled={isLocating}>
            {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            Use my location
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-canopy-700 dark:text-canopy-200">Or drop a pin</p>
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => {
              setValue("latitude", lat, { shouldValidate: true });
              setValue("longitude", lng, { shouldValidate: true });
            }}
          />
          <p className="text-xs text-canopy-400 dark:text-canopy-500">Click anywhere on the map, or drag the pin once it's placed.</p>
        </div>

        <ImageDropzone files={images} onChange={setImages} error={imagesError} />

        <Button type="submit" fullWidth isLoading={mutation.isPending}>
          Submit report
        </Button>
      </form>
    </div>
  );
}
