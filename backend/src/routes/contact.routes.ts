import { Router } from "express";
import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { validateRequest } from "../middleware/validateRequest";
import { contactSchema } from "../validators/contact.validator";
import { authRateLimiter } from "../middleware/rateLimiter";
import { env } from "../config/env";
import { mailTransporter } from "../config/mailer";
import { logger } from "../config/logger";

const router = Router();

const contactHandler = catchAsync(async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  if (env.email.host) {
    await mailTransporter.sendMail({
      from: env.email.from,
      to: env.email.user || env.email.from,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message}</p>`
    });
  } else {
    logger.warn(`Email not configured — contact message from ${email} not sent`);
  }

  res.status(200).json({ message: "Message sent — we'll get back to you shortly" });
});

router.post("/", authRateLimiter, validateRequest({ body: contactSchema }), contactHandler);

export default router;
