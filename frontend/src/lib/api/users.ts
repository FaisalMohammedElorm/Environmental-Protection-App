import { supabase } from "@/lib/supabase/client";
import type { AuthUser } from "@/types/auth";

export interface UpdateProfilePayload {
  name: string;
  phone?: string;
}

async function fetchAuthUser(userId: string): Promise<AuthUser> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, role, avatar_url, created_at")
    .eq("id", userId)
    .single();
  if (error || !profile) throw error ?? new Error("Profile not found");

  return {
    id: profile.id,
    name: profile.name,
    email: user?.email ?? "",
    role: profile.role as AuthUser["role"],
    avatarUrl: profile.avatar_url ?? undefined,
    isEmailVerified: Boolean(user?.email_confirmed_at),
    createdAt: profile.created_at
  };
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("profiles").update({ name: payload.name, phone: payload.phone ?? null }).eq("id", user.id);
  if (error) throw error;

  return fetchAuthUser(user.id);
}

// Avatars bucket already has full owner-scoped RLS (public read, owner
// write/update/delete — supabase/migrations/0009_storage_buckets.sql), so
// this uploads directly from the browser — no server code needed at all,
// unlike the private 'reports' bucket.
export async function uploadAvatar(file: File): Promise<AuthUser> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrlData.publicUrl }).eq("id", user.id);
  if (updateError) throw updateError;

  return fetchAuthUser(user.id);
}
