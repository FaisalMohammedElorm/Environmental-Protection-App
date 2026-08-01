import type { INotification } from "../../models/Notification";

export interface PublicNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  relatedReportId?: string;
  createdAt: string;
}

export function serializeNotification(notification: INotification): PublicNotification {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    isRead: notification.isRead,
    relatedReportId: notification.relatedReport?.toString(),
    createdAt: notification.createdAt.toISOString()
  };
}
