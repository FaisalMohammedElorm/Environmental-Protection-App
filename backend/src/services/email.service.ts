import { mailTransporter } from "../config/mailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendMail({ to, subject, html }: SendMailOptions): Promise<void> {
  if (!env.email.host) {
    logger.warn(`Email not configured — skipping send to ${to}: "${subject}"`);
    return;
  }

  try {
    await mailTransporter.sendMail({ from: env.email.from, to, subject, html });
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
  }
}

export async function sendVerificationEmail(to: string, name: string, rawToken: string): Promise<void> {
  const verifyUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;
  await sendMail({
    to,
    subject: "Verify your EcoAlert email",
    html: `
      <p>Hi ${name},</p>
      <p>Welcome to EcoAlert. Please verify your email address to activate your account:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours.</p>
    `
  });
}

export async function sendPasswordResetEmail(to: string, name: string, rawToken: string): Promise<void> {
  const resetUrl = `${env.clientUrl}/reset-password?token=${rawToken}`;
  await sendMail({
    to,
    subject: "Reset your EcoAlert password",
    html: `
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the link below to choose a new one:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
    `
  });
}

export async function sendReportStatusEmail(
  to: string,
  name: string,
  reportId: string,
  status: string
): Promise<void> {
  const reportUrl = `${env.clientUrl}/dashboard/reports/${reportId}`;
  await sendMail({
    to,
    subject: `Your EcoAlert report is now "${status}"`,
    html: `
      <p>Hi ${name},</p>
      <p>Your report <strong>${reportId}</strong> has been updated to <strong>${status}</strong>.</p>
      <p><a href="${reportUrl}">View the report</a></p>
    `
  });
}
