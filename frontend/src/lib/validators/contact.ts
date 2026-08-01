import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  subject: z.string().min(3, "Add a short subject"),
  message: z.string().min(20, "Add a little more detail (at least 20 characters)")
});

export type ContactFormValues = z.infer<typeof contactSchema>;
