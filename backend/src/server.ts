import { createApp } from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./config/db";
import { logger } from "./config/logger";
import { ensureDefaultCategories } from "./services/category.service";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await ensureDefaultCategories();

  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`EcoAlert API listening on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled rejection: ${String(reason)}`);
  });
}

bootstrap();
