import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

interface ValidationTargets {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(schemas: ValidationTargets) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};
    const parsed: Partial<Record<"body" | "query" | "params", unknown>> = {};

    (["body", "query", "params"] as const).forEach((key) => {
      const schema = schemas[key];
      if (!schema) return;

      const result = schema.safeParse(req[key]);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const field = `${key}.${issue.path.join(".")}`;
          errors[field] = [...(errors[field] ?? []), issue.message];
        });
      } else {
        parsed[key] = result.data;
      }
    });

    if (Object.keys(errors).length > 0) {
      next(ApiError.badRequest("Validation failed", errors));
      return;
    }

    // Only mutate the request after ALL schemas pass — prevents partial writes
    // where a failing body schema still left a mutated req.query behind.
    (["body", "query", "params"] as const).forEach((key) => {
      if (parsed[key] !== undefined) {
        req[key] = parsed[key];
      }
    });

    next();
  };
}

