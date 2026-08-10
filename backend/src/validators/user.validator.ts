import { z } from "zod";

// Email changes go through Supabase Auth directly (its own confirmation
// flow) — this endpoint only ever touches profile fields Express owns.
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional()
});
