import { sql } from "../config/db";
import type { AuthenticatedUser } from "../types/express";

interface RecordAuditLogInput {
  actor: AuthenticatedUser;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string>;
}

export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  await sql`
    insert into public.audit_logs (actor_id, actor_name, actor_role, action, target_type, target_id, metadata)
    values (
      ${input.actor.id}, ${input.actor.name}, ${input.actor.role},
      ${input.action}, ${input.targetType}, ${input.targetId},
      ${input.metadata ? sql.json(input.metadata) : null}
    )
  `;
}
