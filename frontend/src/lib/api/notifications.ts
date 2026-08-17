import { supabase } from "@/lib/supabase/client";
import type { AppNotification } from "@/types/notification";
import type { PaginatedResponse } from "@/types/report";

const PAGE_SIZE = 20;
const NOTIFICATION_SELECT = "id, type, title, body, is_read, related_report_id, created_at";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  related_report_id: string | null;
  created_at: string;
}

function serialize(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type as AppNotification["type"],
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    relatedReportId: row.related_report_id ?? undefined,
    createdAt: row.created_at
  };
}

export async function getNotifications(page = 1): Promise<PaginatedResponse<AppNotification>> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;

  const items = ((data ?? []) as unknown as NotificationRow[]).map(serialize);
  const total = count ?? 0;
  return { items, total, page, limit: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .select(NOTIFICATION_SELECT)
    .single();
  if (error || !data) throw error ?? new Error("Notification not found");
  return serialize(data as unknown as NotificationRow);
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  if (error) throw error;
  return { message: "All notifications marked read" };
}
