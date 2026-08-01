import { Schema, model, type Document, type Model } from "mongoose";

export interface ISettings extends Document {
  siteName: string;
  supportEmail: string;
  autoAssignReports: boolean;
  reportResolutionSlaHours: number;
  allowPublicReportSubmission: boolean;
}

const settingsSchema = new Schema<ISettings>(
  {
    siteName: { type: String, default: "EcoAlert" },
    supportEmail: { type: String, default: "hello@ecoalert.app" },
    autoAssignReports: { type: Boolean, default: false },
    reportResolutionSlaHours: { type: Number, default: 72 },
    allowPublicReportSubmission: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Settings: Model<ISettings> = model<ISettings>("Settings", settingsSchema);

export async function getOrCreateSettings(): Promise<ISettings> {
  const existing = await Settings.findOne();
  if (existing) return existing;
  return Settings.create({});
}
