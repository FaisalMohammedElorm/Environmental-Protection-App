"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { AuthLayout } from "@/components/ui/auth-layout";
import { verifyEmail } from "@/lib/api/auth";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const hasRun = useRef(false);
  const [status, setStatus] = useState<"pending" | "success" | "error">(token ? "pending" : "error");

  const mutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => setStatus("success"),
    onError: () => setStatus("error")
  });

  useEffect(() => {
    if (token && !hasRun.current) {
      hasRun.current = true;
      mutation.mutate(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <AuthLayout eyebrow="Email verification" title="Link missing its token">
        <div className="rounded-2xl border border-canopy-100 dark:border-canopy-700 bg-mist/60 dark:bg-canopy-800/60 p-6">
          <XCircle className="h-8 w-8 text-alert-clay" strokeWidth={1.75} />
          <p className="mt-4 text-sm text-canopy-600 dark:text-canopy-300">
            This verification link is missing its token. Try opening the link from your email again,
            or log in and request a new one from your settings.
          </p>
        </div>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-canopy-700 dark:text-canopy-200">
          Back to log in
        </Link>
      </AuthLayout>
    );
  }

  if (status === "pending") {
    return (
      <AuthLayout eyebrow="Email verification" title="Verifying your email...">
        <div className="flex items-center gap-3 rounded-2xl border border-canopy-100 dark:border-canopy-700 bg-mist/60 dark:bg-canopy-800/60 p-6">
          <Loader2 className="h-6 w-6 animate-spin text-canopy-500 dark:text-canopy-400" />
          <p className="text-sm text-canopy-600 dark:text-canopy-300">Just a moment while we confirm your link.</p>
        </div>
      </AuthLayout>
    );
  }

  if (status === "error") {
    return (
      <AuthLayout eyebrow="Email verification" title="That link didn't work">
        <div className="rounded-2xl border border-canopy-100 dark:border-canopy-700 bg-mist/60 dark:bg-canopy-800/60 p-6">
          <XCircle className="h-8 w-8 text-alert-clay" strokeWidth={1.75} />
          <p className="mt-4 text-sm text-canopy-600 dark:text-canopy-300">
            This verification link is invalid or has expired. You can still use EcoAlert — log in and
            we'll offer to resend a fresh link from your settings.
          </p>
        </div>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-canopy-700 dark:text-canopy-200">
          Back to log in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Email verification" title="Email verified">
      <div className="rounded-2xl border border-canopy-100 dark:border-canopy-700 bg-mist/60 dark:bg-canopy-800/60 p-6">
        <CheckCircle2 className="h-8 w-8 text-moss-dark" strokeWidth={1.75} />
        <p className="mt-4 text-sm text-canopy-600 dark:text-canopy-300">
          Your email address is confirmed. You're all set.
        </p>
      </div>
      <Link href="/login" className="btn-primary mt-6 inline-flex">
        Continue to log in
      </Link>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
