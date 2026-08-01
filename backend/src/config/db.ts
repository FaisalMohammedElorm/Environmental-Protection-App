import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

mongoose.set("strictQuery", true);

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10000 });
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
