import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendContactEmail } from "../services/email.service";

export const contactHandler = catchAsync(async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body as {
    name: string;
    email: string;
    subject: string;
    message: string;
  };

  await sendContactEmail(name, email, subject, message);

  res.status(200).json({ message: "Message sent — we'll get back to you shortly" });
});
