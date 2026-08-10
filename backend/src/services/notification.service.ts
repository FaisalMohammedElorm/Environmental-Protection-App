import { sql } from "../config/db";
import type { NotificationType } from "../types/enums";
import { ApiError } from "../utils/ApiError";
import { paginate, type Paginated } from "../utils/apiResponse";
import {
  serializeNotification,
  type PublicNotification,
  type NotificationRow
} from "../utils/serializers/notification.serializer";

interface CreateNotificationInput {
  user: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedReport?: string;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await sql`
    insert into public.notifications (user_id, type, title, body, related_report_id)
    values (${input.user}, ${input.type}, ${input.title}, ${input.body}, ${input.relatedReport ?? null})
  `;
}

export async function listNotifications(
  userId: string,
  page: number,
  limit: number
): Promise<Paginated<PublicNotification>> {
  const offset = (page - 1) * limit;

  const [rows, countRows] = await Promise.all([
    sql<NotificationRow[]>`
      select id, type, title, body, is_read, related_report_id, created_at
      from public.notifications
      where user_id = ${userId}
      order by created_at desc
      limit ${limit} offset ${offset}
    `,
    sql<{ count: number }[]>`select count(*)::int as count from public.notifications where user_id = ${userId}`
  ]);

  return paginate(rows.map(serializeNotification), countRows[0]!.count, page, limit);
}

export async function markNotificationRead(userId: string, id: string): Promise<PublicNotification> {
  const [row] = await sql<NotificationRow[]>`
    update public.notifications
    set is_read = true
    where id = ${id} and user_id = ${userId}
    returning id, type, title, body, is_read, related_report_id, created_at
  `;
  if (!row) throw ApiError.notFound("Notification not found");
  return serializeNotification(row);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await sql`update public.notifications set is_read = true where user_id = ${userId} and is_read = false`;
}
