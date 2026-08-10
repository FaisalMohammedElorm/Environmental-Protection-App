import { supabase } from "@/lib/supabase/client";
import type { ForgotPasswordPayload, LoginPayload, RegisterPayload } from "@/types/auth";

export async function login(payload: LoginPayload): Promise<{ name: string; role: string }> {
  const { data, error } = await supabase.auth.signInWithPassword(payload);
  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", data.user.id)
    .single();
  if (profileError) throw profileError;

  return { name: profile.name as string, role: profile.role as string };
}

export async function register(payload: RegisterPayload): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: { name: payload.name, phone: payload.phone },
      emailRedirectTo: `${window.location.origin}/verify-email`
    }
  });
  if (error) throw error;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  if (error) throw error;
}

export async function resetPassword(payload: { password: string }): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: payload.password });
  if (error) throw error;
}

// Shared by /verify-email (signup confirmation) and /reset-password
// (recovery) — both links land with a `code` param that must be exchanged
// for a session before the page can do anything else.
export async function exchangeCodeForSession(code: string): Promise<void> {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}
