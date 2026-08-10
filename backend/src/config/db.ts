import postgres from "postgres";
import { env } from "./env";
import { logger } from "./logger";

export const sql = postgres(env.databaseUrl, {
  max: 10,
  onnotice: () => {}
});

export async function connectDatabase(): Promise<void> {
  try {
    await sql`select 1`;
    logger.info("Postgres connected");
  } catch (error) {
    logger.error(`Postgres connection failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await sql.end();
}
