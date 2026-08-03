import { z } from "zod";
import { REPORT_SEVERITIES, REPORT_STATUSES } from "../types/enums";

const numericString = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .refine((val) => !Number.isNaN(Number(val)), `${label} must be a number`)
    .transform(Number);

// Category is validated against the live Category collection in report.service.ts,
// not a fixed enum here — this only enforces the slug shape is well-formed.
const categorySlug = z
  .string({ required_error: "Category is required" })
  .min(1, "Category is required")
  .max(60);

export const createReportSchema = z.object({
  category: categorySlug,
  severity: z.enum(REPORT_SEVERITIES as [string, ...string[]], {
    errorMap: () => ({ message: "Choose a valid severity" })
  }),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  address: z.string().min(3, "Address is required").max(300),
  latitude: numericString("Latitude").pipe(z.number().min(-90).max(90)),
  longitude: numericString("Longitude").pipe(z.number().min(-180).max(180))
});

export const listReportsQuerySchema = z.object({
  status: z.enum(REPORT_STATUSES as [string, ...string[]]).optional(),
  category: z.string().optional(),
  severity: z.enum(REPORT_SEVERITIES as [string, ...string[]]).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "severity", "status"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 10))
    .pipe(z.number().int().min(1).max(100))
});

export const updateReportSchema = z.object({
  category: categorySlug.optional(),
  severity: z.enum(REPORT_SEVERITIES as [string, ...string[]]).optional(),
  description: z.string().min(10).max(1000).optional(),
  address: z.string().min(3).max(300).optional()
});

export const updateStatusSchema = z.object({
  status: z.enum(REPORT_STATUSES as [string, ...string[]], {
    errorMap: () => ({ message: "Choose a valid status" })
  })
});

export const assignReportSchema = z.object({
  officerId: z
    .string()
    .min(1, "officerId is required")
    .regex(/^[a-f\d]{24}$/i, "officerId must be a valid ID")
});

export const addCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(1000)
});

export const reportIdParamSchema = z.object({
  id: z.string().min(1)
});
