import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { CSRF_COOKIE_NAME } from "../utils/cookies";

export function verifyCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
  const headerToken = req.headers["x-csrf-token"];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(ApiError.forbidden("Invalid or missing CSRF token"));
    return;
  }

  next();
}
