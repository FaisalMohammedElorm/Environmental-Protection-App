import { AuditLog } from "../models/AuditLog";
import type { AuthenticatedUser } from "../types/express";
import { User } from "../models/User";

interface RecordAuditLogInput {
  actor: AuthenticatedUser;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string>;
}

export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  const actorUser = await User.findById(input.actor.id).select("name");
  await AuditLog.create({
    actor: input.actor.id,
    actorName: actorUser?.name ?? "Unknown",
    actorRole: input.actor.role,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata
  });
}
