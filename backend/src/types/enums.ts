export type UserRole = "citizen" | "officer" | "admin";

// Report categories are NOT a fixed TypeScript union — they're validated at
// runtime against the live, admin-manageable Category collection (see
// services/category.service.ts). This list is only the *default seed data*
// created on first boot so the platform is usable out of the box; admins can
// add, rename, or deactivate categories afterward and reports can use them
// immediately, since validation checks the database, not this list.
export type ReportCategory = string;

export const DEFAULT_CATEGORIES: string[] = [
  "Illegal dumping",
  "Overflowing bin",
  "Flooding",
  "Pollution",
  "Blocked drain",
  "Bush fire",
  "Illegal mining",
  "Water pollution",
  "Air pollution",
  "Tree cutting",
  "Other"
];

export type ReportSeverity = "low" | "moderate" | "high" | "critical";
export const REPORT_SEVERITIES: ReportSeverity[] = ["low", "moderate", "high", "critical"];

export type ReportStatus = "new" | "under_review" | "assigned" | "in_progress" | "resolved" | "rejected";
export const REPORT_STATUSES: ReportStatus[] = [
  "new",
  "under_review",
  "assigned",
  "in_progress",
  "resolved",
  "rejected"
];

export type NotificationType = "report_status_changed" | "report_assigned" | "report_comment" | "system";
export const NOTIFICATION_TYPES: NotificationType[] = [
  "report_status_changed",
  "report_assigned",
  "report_comment",
  "system"
];

export type TokenType = "refresh" | "email_verification" | "password_reset";
