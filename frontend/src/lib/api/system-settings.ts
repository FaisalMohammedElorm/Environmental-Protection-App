import { supabase } from "@/lib/supabase/client";

export interface SystemSettings {
  siteName: string;
  supportEmail: string;
  autoAssignReports: boolean;
  reportResolutionSlaHours: number;
  allowPublicReportSubmission: boolean;
}

const SETTINGS_SELECT = "site_name, support_email, auto_assign_reports, report_resolution_sla_hours, allow_public_report_submission";

interface SettingsRow {
  site_name: string;
  support_email: string;
  auto_assign_reports: boolean;
  report_resolution_sla_hours: number;
  allow_public_report_submission: boolean;
}

function serialize(row: SettingsRow): SystemSettings {
  return {
    siteName: row.site_name,
    supportEmail: row.support_email,
    autoAssignReports: row.auto_assign_reports,
    reportResolutionSlaHours: row.report_resolution_sla_hours,
    allowPublicReportSubmission: row.allow_public_report_submission
  };
}

// The settings row is seeded once by the 0011 migration (replacing the old
// "auto-create singleton row on first read" logic) — id is always `true`.
export async function getSystemSettings(): Promise<SystemSettings> {
  const { data, error } = await supabase.from("settings").select(SETTINGS_SELECT).eq("id", true).single();
  if (error || !data) throw error ?? new Error("Settings not found");
  return serialize(data as unknown as SettingsRow);
}

export async function updateSystemSettings(payload: SystemSettings): Promise<SystemSettings> {
  const { data, error } = await supabase
    .from("settings")
    .update({
      site_name: payload.siteName,
      support_email: payload.supportEmail,
      auto_assign_reports: payload.autoAssignReports,
      report_resolution_sla_hours: payload.reportResolutionSlaHours,
      allow_public_report_submission: payload.allowPublicReportSubmission
    })
    .eq("id", true)
    .select(SETTINGS_SELECT)
    .single();
  if (error || !data) throw error ?? new Error("Could not update settings");
  return serialize(data as unknown as SettingsRow);
}
