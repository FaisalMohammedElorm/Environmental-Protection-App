import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { logger } from "../config/logger";
import { env } from "../config/env";

// postgres.js surfaces Postgres error responses with these fields — see
// https://www.postgresql.org/docs/current/errcodes-appendix.html for codes.
interface PostgresError extends Error {
  code: string;
  detail?: string;
  constraint_name?: string;
  column_name?: string;
}

function isPostgresError(err: unknown): err is PostgresError {
  return typeof err === "object" && err !== null && typeof (err as { code?: unknown }).code === "string";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (isPostgresError(err) && err.code === "23505") {
    // unique_violation
    const field = err.column_name ?? err.constraint_name ?? "value";
    apiError = ApiError.conflict(`${field} already in use`);
  } else if (isPostgresError(err) && err.code === "23503") {
    // foreign_key_violation
    apiError = ApiError.conflict("This item is referenced by other records and can't be modified or deleted");
  } else if (isPostgresError(err) && err.code === "23514") {
    // check_violation
    apiError = ApiError.badRequest("Validation failed");
  } else if (isPostgresError(err) && err.code === "22P02") {
    // invalid_text_representation (e.g. malformed UUID)
    apiError = ApiError.badRequest("Invalid ID or value format");
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
