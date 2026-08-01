import { Schema, model, type Document, type Model, type Types } from "mongoose";
import type { UserRole } from "../types/enums";

export interface IAuditLog extends Document {
  actor: Types.ObjectId;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, enum: ["citizen", "officer", "admin"], required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1 });

export const AuditLog: Model<IAuditLog> = model<IAuditLog>("AuditLog", auditLogSchema);
