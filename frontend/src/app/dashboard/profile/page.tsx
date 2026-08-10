"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Camera, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { updateProfile, uploadAvatar } from "@/lib/api/users";
import { profileSchema, type ProfileFormValues } from "@/lib/validators/profile";

export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema)
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, phone: "" });
    }
  }, [user, reset]);

  // Profile writes go through Express, but identity is now sourced from
  // Supabase (see use-current-user.ts) — Express's response shape no longer
  // matches the cached AuthUser exactly, so refetch through that path
  // instead of splicing the raw response into the cache.
  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Profile updated");
    },
    onError: () => toast.error("Couldn't update your profile")
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Photo updated");
    },
    onError: () => toast.error("Couldn't upload that photo"),
    onSettled: () => {
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  });

  const initials = user?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <span className="eyebrow mb-1 block">Account</span>
        <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">Your profile</h2>
      </div>

      <div className="card mb-6 flex items-center gap-5 p-6">
        <div className="relative">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-canopy-700 text-lg font-semibold text-paper">
            {user?.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.name} fill sizes="80px" className="object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarMutation.isPending}
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-paper bg-moss text-canopy-900 dark:border-canopy-800"
          >
            {avatarMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) avatarMutation.mutate(file);
            }}
          />
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">{user?.name}</p>
          <p className="text-sm text-canopy-500 dark:text-canopy-400">JPEG, PNG, or WEBP — up to 5MB</p>
        </div>
      </div>

      <form className="card flex flex-col gap-5 p-8" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Input label="Full name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" value={user?.email ?? ""} disabled hint="Contact support to change your email" />
        <Input label="Phone (optional)" type="tel" error={errors.phone?.message} {...register("phone")} />

        <Button type="submit" isLoading={mutation.isPending} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
    </div>
  );
}
