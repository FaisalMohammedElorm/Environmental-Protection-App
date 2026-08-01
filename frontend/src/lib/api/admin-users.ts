import { apiClient } from "@/lib/api/client";
import type { AdminUser, AdminUserListParams } from "@/types/admin-user";
import type { PaginatedResponse } from "@/types/report";

export async function getUsers(params: AdminUserListParams): Promise<PaginatedResponse<AdminUser>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminUser>>("/admin/users", { params });
  return data;
}

export async function setUserActive(id: string, isActive: boolean): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/admin/users/${id}/status`, { isActive });
  return data;
}

export async function setUserRole(id: string, role: string): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/admin/users/${id}/role`, { role });
  return data;
}
