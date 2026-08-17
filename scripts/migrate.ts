import fs from "fs";
import path from "path";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const MIGRATIONS_DIR = path.resolve(__dirname, "../supabase/migrations");

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    await sql`
      create table if not exists public.schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      )
    `;
    // No policies defined below — RLS with zero policies means "default
    // deny" for the anon/authenticated PostgREST roles, same posture as
    // every table defined in the migrations themselves. Only non-sensitive
    // bookkeeping (filenames + timestamps) lives here, but there's no
    // reason to leave it wide open via the public API either.
    await sql`alter table public.schema_migrations enable row level security`;

    const applied = new Set((await sql`select filename from public.schema_migrations`).map((r) => r.filename as string));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        // eslint-disable-next-line no-console
        console.log(`skip  ${file} (already applied)`);
        continue;
      }

      const contents = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      // eslint-disable-next-line no-console
      console.log(`apply ${file}`);

      await sql.begin(async (tx) => {
        await tx.unsafe(contents);
        await tx`insert into public.schema_migrations (filename) values (${file})`;
      });
    }

    // eslint-disable-next-line no-console
    console.log("done");
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
