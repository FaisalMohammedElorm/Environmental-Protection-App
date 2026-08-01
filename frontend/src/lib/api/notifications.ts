import { apiClient } from "@/lib/api/client";
import type { AppNotification } from "@/types/notification";
import type { PaginatedResponse } from "@/types/report";

export async function getNotifications(page = 1): Promise<PaginatedResponse<AppNotification>> {
  const { data } = await apiClient.get<PaginatedResponse<AppNotification>>("/notifications", {
    params: { page, limit: 20 }
  });
  return data;
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const { data } = await apiClient.patch<AppNotification>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/notifications/read-all");
  return data;
}
