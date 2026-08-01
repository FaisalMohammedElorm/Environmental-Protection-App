import nodemailer from "nodemailer";
import { env } from "./env";

export const mailTransporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.port === 465,
  auth: env.email.user
    ? {
        user: env.email.user,
        pass: env.email.password
      }
    : undefined
});
