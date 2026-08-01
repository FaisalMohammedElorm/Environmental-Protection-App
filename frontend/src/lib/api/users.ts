import { apiClient } from "@/lib/api/client";
import type { AuthUser } from "@/types/auth";

export interface UpdateProfilePayload {
  name: string;
  email: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>("/users/me", payload);
  return data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/users/me/change-password", payload);
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
