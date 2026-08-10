"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2 } from "lucide-react";

import { AuthLayout } from "@/components/ui/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exchangeCodeForSession, resetPassword } from "@/lib/api/auth";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validators/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const hasRun = useRef(false);
  const [sessionState, setSessionState] = useState<"pending" | "ready" | "error">(code ? "pending" : "error");
  const [isDone, setIsDone] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema)
  });

  useEffect(() => {
    if (code && !hasRun.current) {
      hasRun.current = true;
      exchangeCodeForSession(code)
        .then(() => setSessionState("ready"))
        .catch(() => setSessionState("error"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      setIsDone(true);
      setTimeout(() => router.push("/login"), 2500);
    },
    onError: () => {
      toast.error("Could not update your password — try requesting a new link");
    }
  });

  if (sessionState === "error") {
    return (
      <AuthLayout eyebrow="Reset password" title="Link missing or expired">
        <p className="text-sm text-canopy-500 dark:text-canopy-400">
          This reset link is invalid or has expired. Request a new one from the forgot password page.
        </p>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm font-semibold text-canopy-700 dark:text-canopy-200">
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  if (sessionState === "pending") {
    return (
      <AuthLayout eyebrow="Reset password" title="Verifying your link...">
        <div className="flex items-center gap-3 rounded-2xl border border-canopy-100 dark:border-canopy-700 bg-mist/60 dark:bg-canopy-800/60 p-6">
          <Loader2 className="h-6 w-6 animate-spin text-canopy-500 dark:text-canopy-400" />
          <p className="text-sm text-canopy-600 dark:text-canopy-300">Just a moment while we confirm your link.</p>
        </div>
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
      <form className="flex flex-col gap-5" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
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
