import { apiClient } from "@/lib/api/client";
import type { AuthUser } from "@/types/auth";

export interface UpdateProfilePayload {
  name: string;
  phone?: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>("/users/me", payload);
  return data;
}

export async function uploadAvatar(file: File): Promise<AuthUser> {
  const formData = new FormData();
  formData.append("avatar", file);
  const { data } = await apiClient.post<AuthUser>("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}
