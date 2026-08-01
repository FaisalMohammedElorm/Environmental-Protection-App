import type { Response } from "express";
import crypto from "crypto";
import { env } from "../config/env";

const REFRESH_COOKIE_NAME = "refreshToken";
const CSRF_COOKIE_NAME = "csrfToken";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    maxAge: THIRTY_DAYS_MS,
    path: "/api/v1/auth"
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
}

/**
 * Double-submit-cookie CSRF protection for the refresh-token / logout endpoints, which
 * (unlike every other endpoint) authenticate purely via an httpOnly cookie with no bearer
 * token — so without this, a malicious site could trigger those requests cross-site using
 * the browser's ambient cookie. This cookie is deliberately NOT httpOnly: the frontend reads
 * it and echoes it back as the X-CSRF-Token header, which a cross-site request can't forge
 * because a third-party page can't read another origin's cookies.
 */
export function setCsrfCookie(res: Response): string {
  const token = crypto.randomBytes(24).toString("hex");
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    maxAge: THIRTY_DAYS_MS,
    path: "/api/v1/auth"
  });
  return token;
}

export function clearCsrfCookie(res: Response): void {
  res.clearCookie(CSRF_COOKIE_NAME, { path: "/api/v1/auth" });
}

export { REFRESH_COOKIE_NAME, CSRF_COOKIE_NAME };
