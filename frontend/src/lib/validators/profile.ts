import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().optional().or(z.literal(""))
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordRule = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordRule,
    confirmNewPassword: z.string().min(1, "Confirm your new password")
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"]
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
