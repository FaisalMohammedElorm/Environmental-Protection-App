"use server";

import nodemailer from "nodemailer";
import { contactSchema } from "@/lib/validators/contact";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export async function sendContactMessageAction(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ message: string }> {
  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid contact form submission");
  }
  const { name, email, subject, message } = parsed.data;

  // Matches the old email.service.ts's no-op-if-unconfigured behavior — the
  // contact form still "succeeds" from the user's point of view in dev.
  if (!process.env.EMAIL_HOST) {
    console.warn(`Email not configured — skipping contact form send from ${email}`);
    return { message: "Message sent — we'll get back to you shortly" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: Number(process.env.EMAIL_PORT ?? 587) === 465,
    auth: process.env.EMAIL_USER ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD } : undefined
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "EcoAlert <no-reply@ecoalert.app>",
      to: process.env.EMAIL_USER || process.env.EMAIL_FROM || "",
      subject: `[Contact] ${subject}`,
      html: `<p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p><p>${escapeHtml(message)}</p>`
    });
  } catch (error) {
    console.error(`Failed to send contact email: ${(error as Error).message}`);
  }

  return { message: "Message sent — we'll get back to you shortly" };
}
