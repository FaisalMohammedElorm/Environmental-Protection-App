import type { Types } from "mongoose";
import { Token } from "../models/Token";
import type { TokenType } from "../types/enums";
import { generateRawToken, hashToken } from "../utils/hashToken";

const EXPIRY_MS: Record<TokenType, number> = {
  refresh: 30 * 24 * 60 * 60 * 1000, // 30 days
  email_verification: 24 * 60 * 60 * 1000, // 24 hours
  password_reset: 30 * 60 * 1000 // 30 minutes
};

export async function issueToken(userId: Types.ObjectId | string, type: TokenType): Promise<string> {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + EXPIRY_MS[type]);

  await Token.create({ user: userId, tokenHash, type, expiresAt });

  return rawToken;
}

export async function consumeToken(rawToken: string, type: TokenType) {
  const tokenHash = hashToken(rawToken);
  const record = await Token.findOne({ tokenHash, type, expiresAt: { $gt: new Date() } });
  if (!record) return null;

  await Token.deleteOne({ _id: record._id });
  return record;
}

export async function findValidToken(rawToken: string, type: TokenType) {
  const tokenHash = hashToken(rawToken);
  return Token.findOne({ tokenHash, type, expiresAt: { $gt: new Date() } });
}

export async function revokeToken(rawToken: string, type: TokenType): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await Token.deleteOne({ tokenHash, type });
}

export async function revokeAllUserTokens(userId: Types.ObjectId | string, type: TokenType): Promise<void> {
  await Token.deleteMany({ user: userId, type });
}
