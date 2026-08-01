import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";
import { User } from "../models/User";
import type { UserRole } from "../types/enums";
import { catchAsync } from "../utils/catchAsync";

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    throw ApiError.unauthorized("You must be logged in to access this resource");
  }

  const payload = verifyAccessToken(token);

  const user = await User.findById(payload.sub).select("_id role isActive");
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Your session is no longer valid");
  }

  req.user = { id: user.id, role: user.role };
  next();
});

export function restrictTo(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(ApiError.forbidden("You don't have permission to perform this action"));
      return;
    }
    next();
  };
}
