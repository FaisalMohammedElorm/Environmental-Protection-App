"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";

import { AuthLayout } from "@/components/ui/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { forgotPassword } from "@/lib/api/auth";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validators/auth";

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (_data, variables) => {
      setSubmittedEmail(variables.email);
    }
  });

  if (submittedEmail) {
    return (
      <AuthLayout eyebrow="Check your inbox" title="Reset link sent">
        <div className="rounded-2xl border border-canopy-100 dark:border-canopy-700 bg-mist/60 dark:bg-canopy-800/60 p-6">
          <MailCheck className="h-8 w-8 text-moss-dark" strokeWidth={1.75} />
          <p className="mt-4 text-sm text-canopy-600 dark:text-canopy-300">
            If an account exists for <span className="font-semibold text-canopy-800 dark:text-canopy-100">{submittedEmail}</span>,
            we've sent a link to reset the password. It expires in 30 minutes.
          </p>
        </div>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-canopy-700 dark:text-canopy-200">
          Back to log in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Forgot password"
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send a reset link."
      footer={
        <Link href="/login" className="font-semibold text-canopy-700 dark:text-canopy-200 hover:text-canopy-800 dark:hover:text-canopy-100">
          Back to log in
        </Link>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...registerField("email")}
        />
        <Button type="submit" fullWidth isLoading={mutation.isPending}>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
