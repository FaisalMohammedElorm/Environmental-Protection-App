"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { isAuthApiError } from "@supabase/supabase-js";
import { MailCheck } from "lucide-react";

import { AuthLayout } from "@/components/ui/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { register as registerUser } from "@/lib/api/auth";
import { registerSchema, type RegisterFormValues } from "@/lib/validators/auth";

function registerErrorMessage(error: unknown): string {
  if (isAuthApiError(error)) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return "That email is already registered — log in instead.";
    }
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return "Too many attempts — wait a moment and try again.";
    }
    return error.message;
  }
  return "Network error — check your connection and try again.";
}

export default function RegisterPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (_data, variables) => {
      setSubmittedEmail(variables.email);
    }
  });

  // Supabase doesn't grant a session until the email is confirmed, so there's
  // nowhere to redirect to yet — show the same "check your inbox" pattern
  // the forgot-password flow uses instead.
  if (submittedEmail) {
    return (
      <AuthLayout eyebrow="Almost there" title="Confirm your email">
        <div className="rounded-2xl border border-canopy-100 dark:border-canopy-700 bg-mist/60 dark:bg-canopy-800/60 p-6">
          <MailCheck className="h-8 w-8 text-moss-dark" strokeWidth={1.75} />
          <p className="mt-4 text-sm text-canopy-600 dark:text-canopy-300">
            We've sent a confirmation link to{" "}
            <span className="font-semibold text-canopy-800 dark:text-canopy-100">{submittedEmail}</span>. Open it to
            activate your account.
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
      eyebrow="Get started"
      title="Create your account"
      subtitle="Report hazards in your neighborhood and follow them through to resolution."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-canopy-700 dark:text-canopy-200 hover:text-canopy-800 dark:hover:text-canopy-100">
            Log in
          </Link>
        </p>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Ama Owusu"
          error={errors.name?.message}
          {...registerField("name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...registerField("email")}
        />
        <Input
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="+233 55 000 0000"
          error={errors.phone?.message}
          {...registerField("phone")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint="At least 8 characters, with an uppercase letter and a number"
          error={errors.password?.message}
          {...registerField("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...registerField("confirmPassword")}
        />

        <Checkbox
          label={
            <>
              I agree to the{" "}
              <Link href="/terms-of-service" className="font-semibold text-canopy-700 dark:text-canopy-200 underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="font-semibold text-canopy-700 dark:text-canopy-200 underline">
                Privacy Policy
              </Link>
            </>
          }
          error={errors.agreeToTerms?.message}
          {...registerField("agreeToTerms")}
        />

        {mutation.isError ? (
          <p className="text-sm text-alert-clay">{registerErrorMessage(mutation.error)}</p>
        ) : null}

        <Button type="submit" fullWidth isLoading={mutation.isPending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
