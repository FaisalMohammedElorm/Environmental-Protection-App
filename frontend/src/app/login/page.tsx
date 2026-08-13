"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { isAuthApiError } from "@supabase/supabase-js";
import toast from "react-hot-toast";

import { AuthLayout } from "@/components/ui/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/api/auth";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";

export default function LoginPage() {
  const router = useRouter();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.name.split(" ")[0]}`);
      if (data.role === "admin") router.push("/admin");
      else if (data.role === "officer") router.push("/officer");
      else router.push("/dashboard");
    },
    onError: (error) => {
      if (isAuthApiError(error) && error.code === "email_not_confirmed") {
        toast.error("Please confirm your email before logging in — check your inbox for the link.");
      } else if (isAuthApiError(error)) {
        toast.error("Incorrect email or password");
      } else {
        toast.error("Network error — check your connection and try again");
      }
    }
  });

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to EcoAlert"
      subtitle="Track your reports and see what's changed since you last checked."
      footer={
        <p>
          New here?{" "}
          <Link href="/register" className="font-semibold text-canopy-700 dark:text-canopy-200 hover:text-canopy-800 dark:hover:text-canopy-100">
            Create an account
          </Link>
        </p>
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
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...registerField("password")}
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-canopy-600 dark:text-canopy-300 hover:text-canopy-800 dark:hover:text-canopy-100">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth isLoading={mutation.isPending}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
