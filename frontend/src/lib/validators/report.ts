import { z } from "zod";

export const reportSchema = z.object({
  category: z.string().min(1, "Choose a category"),
  severity: z.enum(["low", "moderate", "high", "critical"], {
    errorMap: () => ({ message: "Choose a severity level" })
  }),
  description: z
    .string()
    .min(20, "Add a little more detail (at least 20 characters)")
    .max(1000, "Keep it under 1000 characters"),
  address: z.string().min(3, "Add a location description"),
  latitude: z.number({ invalid_type_error: "Location is required" }),
  longitude: z.number({ invalid_type_error: "Location is required" })
});

export type ReportFormValues = z.infer<typeof reportSchema>;
