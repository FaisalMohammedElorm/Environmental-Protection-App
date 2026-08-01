import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { ApiError } from "../utils/ApiError";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  setCsrfCookie,
  clearCsrfCookie,
  REFRESH_COOKIE_NAME
} from "../utils/cookies";
import { serializeUser } from "../utils/serializers/user.serializer";
import * as authService from "../services/auth.service";

export const registerHandler = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  setRefreshTokenCookie(res, refreshToken);
  setCsrfCookie(res);
  res.status(201).json({ user: serializeUser(user), accessToken });
});

export const loginHandler = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshTokenCookie(res, refreshToken);
  setCsrfCookie(res);
  res.status(200).json({ user: serializeUser(user), accessToken });
});

export const refreshTokenHandler = catchAsync(async (req: Request, res: Response) => {
  const existingToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!existingToken) {
    throw ApiError.unauthorized("No refresh token provided");
  }

  const { accessToken, refreshToken } = await authService.refreshAccessToken(existingToken);
  setRefreshTokenCookie(res, refreshToken);
  setCsrfCookie(res);
  res.status(200).json({ accessToken });
});

export const logoutHandler = catchAsync(async (req: Request, res: Response) => {
  const existingToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  await authService.logout(existingToken);
  clearRefreshTokenCookie(res);
  clearCsrfCookie(res);
  res.status(200).json({ message: "Logged out" });
});

export const forgotPasswordHandler = catchAsync(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res.status(200).json({ message: "If that email exists, a reset link has been sent" });
});

export const resetPasswordHandler = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.status(200).json({ message: "Password updated successfully" });
});

export const verifyEmailHandler = catchAsync(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.token);
  res.status(200).json({ message: "Email verified successfully" });
});

export const getMeHandler = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  res.status(200).json({ user: serializeUser(user) });
});
