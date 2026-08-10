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

// Email verification and password reset are now Supabase Auth's job — it
// sends its own emails (built-in sender or your custom SMTP configured in
// the Supabase dashboard) as part of signUp()/resetPasswordForEmail().

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

export async function sendContactEmail(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<void> {
  await sendMail({
    to: env.email.user || env.email.from,
    subject: `[Contact] ${subject}`,
    html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message}</p>`
  });
}

