import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Enter a valid email"),
  subject: z.string().min(3, "Subject is required").max(150),
  message: z.string().min(20, "Message must be at least 20 characters").max(2000)
});
