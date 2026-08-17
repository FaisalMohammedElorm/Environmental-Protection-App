import { supabase } from "@/lib/supabase/client";
import type { AuditLogEntry } from "@/types/audit-log";
import type { PaginatedResponse } from "@/types/report";

const PAGE_SIZE = 25;

interface AuditLogRow {
  id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, string> | null;
  created_at: string;
}

// RLS's audit_logs_select_admin gates this to admins already — a non-admin
// caller simply gets an empty result set, not a 403, since RLS filters rows
// rather than rejecting the query outright.
export async function getAuditLogs(page = 1): Promise<PaginatedResponse<AuditLogEntry>> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("audit_logs")
    .select("id, actor_name, actor_role, action, target_type, target_id, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;

  const items: AuditLogEntry[] = ((data ?? []) as unknown as AuditLogRow[]).map((row) => ({
    id: row.id,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at
  }));

  const total = count ?? 0;
  return { items, total, page, limit: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
