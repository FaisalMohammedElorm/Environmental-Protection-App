import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_URL: z.string().default("http://localhost:3000"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters — generate one with `openssl rand -hex 32`"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters — generate one with `openssl rand -hex 32`"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  EMAIL_HOST: z.string().optional().default(""),
  EMAIL_PORT: z.string().optional().default("587"),
  EMAIL_USER: z.string().optional().default(""),
  EMAIL_PASSWORD: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("EcoAlert <no-reply@ecoalert.app>"),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),

  RATE_LIMIT_WINDOW_MINUTES: z.string().default("15"),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("200")
}).refine((data) => data.JWT_SECRET !== data.JWT_REFRESH_SECRET, {
  message: "JWT_SECRET and JWT_REFRESH_SECRET must be different values",
  path: ["JWT_REFRESH_SECRET"]
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const parsedEnv = parsed.data;

export const env = {
  port: Number(parsedEnv.PORT),
  nodeEnv: parsedEnv.NODE_ENV,
  clientUrl: parsedEnv.CLIENT_URL,
  isProduction: parsedEnv.NODE_ENV === "production",
  isTest: parsedEnv.NODE_ENV === "test",

  mongodbUri: parsedEnv.MONGODB_URI,

  jwtSecret: parsedEnv.JWT_SECRET,
  jwtExpiresIn: parsedEnv.JWT_EXPIRES_IN,
  jwtRefreshSecret: parsedEnv.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: parsedEnv.JWT_REFRESH_EXPIRES_IN,

  email: {
    host: parsedEnv.EMAIL_HOST,
    port: Number(parsedEnv.EMAIL_PORT),
    user: parsedEnv.EMAIL_USER,
    password: parsedEnv.EMAIL_PASSWORD,
    from: parsedEnv.EMAIL_FROM
  },

  cloudinary: {
    cloudName: parsedEnv.CLOUDINARY_CLOUD_NAME,
    apiKey: parsedEnv.CLOUDINARY_API_KEY,
    apiSecret: parsedEnv.CLOUDINARY_API_SECRET
  },

  rateLimit: {
    windowMinutes: Number(parsedEnv.RATE_LIMIT_WINDOW_MINUTES),
    maxRequests: Number(parsedEnv.RATE_LIMIT_MAX_REQUESTS)
  }
};
