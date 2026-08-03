import { User, type IUser } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { signAccessToken } from "../utils/jwt";
import { issueToken, consumeToken, revokeToken, revokeAllUserTokens } from "./token.service";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.service";

interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

function issueAccessToken(user: IUser): string {
  return signAccessToken({ sub: user.id, role: user.role });
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw ApiError.conflict("An account with that email already exists");
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    password: input.password
  });

  const verificationToken = await issueToken(user.id, "email_verification");
  await sendVerificationEmail(user.email, user.name, verificationToken);

  const accessToken = issueAccessToken(user);
  const refreshToken = await issueToken(user.id, "refresh");

  return { user, accessToken, refreshToken };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email }).select("+password");
  if (!user || !(await user.comparePassword(input.password))) {
    throw ApiError.unauthorized("Incorrect email or password");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("This account has been suspended. Contact support for help.");
  }

  if (!user.isEmailVerified) {
    throw ApiError.forbidden("Please verify your email address before logging in.");
  }

  const accessToken = issueAccessToken(user);
  const refreshToken = await issueToken(user.id, "refresh");

  return { user, accessToken, refreshToken };
}

export async function refreshAccessToken(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const record = await consumeToken(rawRefreshToken, "refresh");
  if (!record) {
    throw ApiError.unauthorized("Your session has expired. Please log in again.");
  }

  const user = await User.findById(record.user);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Your session is no longer valid");
  }

  const accessToken = issueAccessToken(user);
  const refreshToken = await issueToken(user.id, "refresh");

  return { accessToken, refreshToken };
}

export async function logout(rawRefreshToken: string | undefined): Promise<void> {
  if (rawRefreshToken) {
    await revokeToken(rawRefreshToken, "refresh");
  }
}

export async function logoutAll(userId: string): Promise<void> {
  await revokeAllUserTokens(userId, "refresh");
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) return; // Don't reveal whether the email is registered.

  const resetToken = await issueToken(user.id, "password_reset");
  await sendPasswordResetEmail(user.email, user.name, resetToken);
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const record = await consumeToken(rawToken, "password_reset");
  if (!record) {
    throw ApiError.badRequest("That reset link is invalid or has expired");
  }

  const user = await User.findById(record.user);
  if (!user) {
    throw ApiError.badRequest("That reset link is invalid or has expired");
  }

  user.password = newPassword;
  await user.save();
}

export async function verifyEmail(rawToken: string): Promise<void> {
  const record = await consumeToken(rawToken, "email_verification");
  if (!record) {
    throw ApiError.badRequest("That verification link is invalid or has expired");
  }

  await User.findByIdAndUpdate(record.user, { isEmailVerified: true });
}

export async function getCurrentUser(userId: string): Promise<IUser> {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  return user;
}
