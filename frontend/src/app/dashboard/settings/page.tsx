"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase/client";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/validators/profile";

export default function SettingsPage() {
  const { data: user } = useCurrentUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema)
  });

  const mutation = useMutation({
    mutationFn: async (values: ChangePasswordFormValues) => {
      if (!user?.email) throw new Error("Not signed in");

      // Supabase's updateUser() doesn't require the current password (the
      // active session already proves identity) — re-authenticate first so
      // "change password" still requires knowing the current one, same as
      // the old Express-backed flow did.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: values.currentPassword
      });
      if (reauthError) throw reauthError;

      const { error } = await supabase.auth.updateUser({ password: values.newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password updated");
      reset();
    },
    onError: () => toast.error("Current password is incorrect")
  });

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <span className="eyebrow mb-1 block">Preferences</span>
        <h2 className="font-display text-2xl font-semibold text-canopy-800 dark:text-canopy-100">Settings</h2>
      </div>

      <div className="card flex items-center justify-between p-6">
        <div>
          <p className="font-medium text-canopy-800 dark:text-canopy-100">Appearance</p>
          <p className="text-sm text-canopy-500 dark:text-canopy-400">Switch between light and dark mode.</p>
        </div>
        <ThemeToggle className="h-10 w-10" />
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">Change password</h3>
        <form className="card flex flex-col gap-5 p-6" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters, with an uppercase letter and a number"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmNewPassword?.message}
            {...register("confirmNewPassword")}
          />
          <Button type="submit" isLoading={mutation.isPending}>
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
