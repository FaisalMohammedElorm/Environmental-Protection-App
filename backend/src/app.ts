import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import { env } from "./config/env";
import { apiRouter } from "./routes";
import { requestLogger } from "./middleware/requestLogger";
import { apiRateLimiter } from "./middleware/rateLimiter";
import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

export function createApp(): Application {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  // Vercel preview deployments get a new randomly-suffixed URL per push
  // (e.g. environmental-protection-app-f7xc-45j2m9jp3.vercel.app), so the
  // explicit CLIENT_URL list can't enumerate them — match by project prefix instead.
  const vercelPreviewOrigin = /^https:\/\/environmental-protection-app-[a-z0-9-]+\.vercel\.app$/;

  app.use(
    cors({
      origin: (origin, callback) => {
        // No Origin header (server-to-server, curl, mobile apps) — allow.
        if (!origin || env.clientUrls.includes(origin) || vercelPreviewOrigin.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} is not allowed by CORS`));
        }
      },
      credentials: true
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));

  if (!env.isTest) {
    app.use(requestLogger);
  }

  app.use("/api/v1", apiRateLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
