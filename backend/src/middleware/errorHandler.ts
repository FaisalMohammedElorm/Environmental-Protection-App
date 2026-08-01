import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { logger } from "../config/logger";
import { env } from "../config/env";

interface MongooseCastError extends Error {
  name: "CastError";
  path: string;
}

interface MongooseValidationError extends Error {
  name: "ValidationError";
  errors: Record<string, { message: string }>;
}

interface MongoDuplicateKeyError extends Error {
  code: number;
  keyValue: Record<string, unknown>;
}

function isMongoDuplicateKeyError(err: unknown): err is MongoDuplicateKeyError {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if ((err as Error)?.name === "CastError") {
    const castErr = err as MongooseCastError;
    apiError = ApiError.badRequest(`Invalid value for field: ${castErr.path}`);
  } else if ((err as Error)?.name === "ValidationError") {
    const validationErr = err as MongooseValidationError;
    const errors: Record<string, string[]> = {};
    Object.entries(validationErr.errors).forEach(([field, value]) => {
      errors[field] = [value.message];
    });
    apiError = ApiError.badRequest("Validation failed", errors);
  } else if (isMongoDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue)[0] ?? "field";
    apiError = ApiError.conflict(`${field} already in use`);
  } else if ((err as Error)?.name === "JsonWebTokenError" || (err as Error)?.name === "TokenExpiredError") {
    apiError = ApiError.unauthorized("Invalid or expired token");
  } else {
    apiError = ApiError.internal();
    logger.error((err as Error)?.stack ?? String(err));
  }

  if (apiError.statusCode >= 500) {
    logger.error(apiError.stack ?? apiError.message);
  }

  res.status(apiError.statusCode).json({
    message: apiError.message,
    ...(apiError.errors ? { errors: apiError.errors } : {}),
    ...(env.isProduction ? {} : { stack: (err as Error)?.stack })
  });
}
