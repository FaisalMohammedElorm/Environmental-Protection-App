"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { AuthLayout } from "@/components/ui/auth-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { register as registerUser } from "@/lib/api/auth";
import { registerSchema, type RegisterFormValues } from "@/lib/validators/auth";

export default function RegisterPage() {
  const router = useRouter();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      toast.success("Account created — check your email to verify it");
      router.push("/dashboard");
    },
    onError: () => {
      toast.error("Could not create your account. That email may already be registered.");
    }
  });

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

        <Button type="submit" fullWidth isLoading={mutation.isPending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
