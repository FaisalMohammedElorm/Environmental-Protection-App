import { Schema, model, type Document, type Model, type Types } from "mongoose";
import type { UserRole } from "../types/enums";

export interface IComment extends Document {
  report: Types.ObjectId;
  author: Types.ObjectId;
  authorRole: UserRole;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    report: { type: Schema.Types.ObjectId, ref: "Report", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorRole: { type: String, enum: ["citizen", "officer", "admin"], required: true },
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 }
  },
  { timestamps: true }
);

commentSchema.index({ report: 1, createdAt: 1 });

export const Comment: Model<IComment> = model<IComment>("Comment", commentSchema);
