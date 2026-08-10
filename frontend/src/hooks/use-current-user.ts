"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { AuthUser } from "@/types/auth";

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, role, avatar_url, created_at")
    .eq("id", user.id)
    .single();
  if (error || !profile) return null;

  return {
    id: profile.id as string,
    name: profile.name as string,
    email: user.email ?? "",
    role: profile.role as AuthUser["role"],
    avatarUrl: (profile.avatar_url as string | null) ?? undefined,
    isEmailVerified: Boolean(user.email_confirmed_at),
    createdAt: profile.created_at as string
  };
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    retry: false
  });
}
