export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  related_report_id: string | null;
  created_at: Date;
}

export interface PublicNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  relatedReportId?: string;
  createdAt: string;
}

export function serializeNotification(row: NotificationRow): PublicNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    relatedReportId: row.related_report_id ?? undefined,
    createdAt: row.created_at.toISOString()
  };
}
