import { z } from "zod";

export const listUsersQuerySchema = z.object({
  role: z.enum(["citizen", "officer", "admin"]).optional(),
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 25))
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean()
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["citizen", "officer", "admin"])
});

export const userIdParamSchema = z.object({
  id: z.string().min(1)
});

export const updateSettingsSchema = z.object({
  siteName: z.string().min(1).max(100),
  supportEmail: z.string().email(),
  autoAssignReports: z.boolean(),
  reportResolutionSlaHours: z.number().min(1).max(720),
  allowPublicReportSubmission: z.boolean()
});
