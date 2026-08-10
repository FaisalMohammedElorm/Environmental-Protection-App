import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_URL: z.string().default("http://localhost:3000"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  SUPABASE_URL: z.string().min(1, "SUPABASE_URL is required"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  EMAIL_HOST: z.string().optional().default(""),
  EMAIL_PORT: z.string().optional().default("587"),
  EMAIL_USER: z.string().optional().default(""),
  EMAIL_PASSWORD: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("EcoAlert <no-reply@ecoalert.app>"),

  RATE_LIMIT_WINDOW_MINUTES: z.string().default("15"),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("200")
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
  // CLIENT_URL may be a comma-separated list (e.g. local dev origin + deployed frontend origin)
  clientUrls: parsedEnv.CLIENT_URL.split(",").map((url) => url.trim()).filter(Boolean),
  isProduction: parsedEnv.NODE_ENV === "production",
  isTest: parsedEnv.NODE_ENV === "test",

  databaseUrl: parsedEnv.DATABASE_URL,

  supabase: {
    url: parsedEnv.SUPABASE_URL,
    anonKey: parsedEnv.SUPABASE_ANON_KEY,
    serviceRoleKey: parsedEnv.SUPABASE_SERVICE_ROLE_KEY
  },

  email: {
    host: parsedEnv.EMAIL_HOST,
    port: Number(parsedEnv.EMAIL_PORT),
    user: parsedEnv.EMAIL_USER,
    password: parsedEnv.EMAIL_PASSWORD,
    from: parsedEnv.EMAIL_FROM
  },

  rateLimit: {
    windowMinutes: Number(parsedEnv.RATE_LIMIT_WINDOW_MINUTES),
    maxRequests: Number(parsedEnv.RATE_LIMIT_MAX_REQUESTS)
  }
};
