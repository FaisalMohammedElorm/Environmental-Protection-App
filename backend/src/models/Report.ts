import { Schema, model, type Document, type Model, type Types } from "mongoose";
import {
  REPORT_SEVERITIES,
  REPORT_STATUSES,
  type ReportCategory,
  type ReportSeverity,
  type ReportStatus
} from "../types/enums";

export interface IReportLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface IReport extends Document {
  category: ReportCategory;
  description: string;
  severity: ReportSeverity;
  status: ReportStatus;
  images: string[];
  location: IReportLocation;
  reportedBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<IReportLocation>(
  {
    address: { type: String, required: true, trim: true, maxlength: 300 },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 }
  },
  { _id: false }
);

const reportSchema = new Schema<IReport>(
  {
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    severity: { type: String, enum: REPORT_SEVERITIES, required: true },
    status: { type: String, enum: REPORT_STATUSES, default: "new" },
    images: { type: [String], default: [], validate: [(arr: string[]) => arr.length <= 8, "Too many images"] },
    location: { type: locationSchema, required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, category: 1, severity: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ assignedTo: 1 });
reportSchema.index({ "location.latitude": 1, "location.longitude": 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ description: "text", "location.address": "text" });

reportSchema.pre("save", function setResolvedAt(next) {
  if (this.isModified("status") && this.status === "resolved" && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

export const Report: Model<IReport> = model<IReport>("Report", reportSchema);
