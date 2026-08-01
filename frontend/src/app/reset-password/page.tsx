"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";

import { AuthLayout } from "@/components/ui/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/lib/api/auth";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validators/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [isDone, setIsDone] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      setIsDone(true);
      setTimeout(() => router.push("/login"), 2500);
    },
    onError: () => {
      toast.error("That reset link is invalid or has expired");
    }
  });

  if (!token) {
    return (
      <AuthLayout eyebrow="Reset password" title="Link missing or expired">
        <p className="text-sm text-canopy-500 dark:text-canopy-400">
          This reset link is missing its token. Request a new one from the forgot password page.
        </p>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm font-semibold text-canopy-700 dark:text-canopy-200">
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  if (isDone) {
    return (
      <AuthLayout eyebrow="All set" title="Password updated">
        <div className="rounded-2xl border border-canopy-100 dark:border-canopy-700 bg-mist/60 dark:bg-canopy-800/60 p-6">
          <CheckCircle2 className="h-8 w-8 text-moss-dark" strokeWidth={1.75} />
          <p className="mt-4 text-sm text-canopy-600 dark:text-canopy-300">
            Your password has been changed. Redirecting you to log in...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Reset password" title="Choose a new password">
      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit((values) => mutation.mutate({ ...values, token }))}
      >
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint="At least 8 characters, with an uppercase letter and a number"
          error={errors.password?.message}
          {...registerField("password")}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...registerField("confirmPassword")}
        />
        <Button type="submit" fullWidth isLoading={mutation.isPending}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
