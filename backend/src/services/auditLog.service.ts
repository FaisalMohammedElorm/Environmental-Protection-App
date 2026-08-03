import { AuditLog } from "../models/AuditLog";
import type { AuthenticatedUser } from "../types/express";

interface RecordAuditLogInput {
  actor: AuthenticatedUser;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string>;
}

export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  await AuditLog.create({
    actor: input.actor.id,
    actorName: input.actor.name,
    actorRole: input.actor.role,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata
  });
}

