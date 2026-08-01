export type NotificationType =
  | "report_status_changed"
  | "report_assigned"
  | "report_comment"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedReportId?: string;
  createdAt: string;
}
