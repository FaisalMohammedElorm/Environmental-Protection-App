import { Schema, model, type Document, type Model, type Types } from "mongoose";
import type { TokenType } from "../types/enums";

export interface IToken extends Document {
  user: Types.ObjectId;
  tokenHash: string;
  type: TokenType;
  expiresAt: Date;
  createdAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    type: { type: String, enum: ["refresh", "email_verification", "password_reset"], required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// MongoDB TTL index — documents are automatically removed once expiresAt has passed.
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
tokenSchema.index({ user: 1, type: 1 });

export const Token: Model<IToken> = model<IToken>("Token", tokenSchema);
