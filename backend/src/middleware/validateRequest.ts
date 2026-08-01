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
        req[key] = result.data;
      }
    });

    if (Object.keys(errors).length > 0) {
      next(ApiError.badRequest("Validation failed", errors));
      return;
    }

    next();
  };
}
