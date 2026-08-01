import { Schema, model, type Document, type Model, type Types } from "mongoose";
import { NOTIFICATION_TYPES, type NotificationType } from "../types/enums";

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedReport?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 150 },
    body: { type: String, required: true, maxlength: 500 },
    isRead: { type: Boolean, default: false },
    relatedReport: { type: Schema.Types.ObjectId, ref: "Report" }
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> = model<INotification>("Notification", notificationSchema);
