# EcoAlert — Admin scripts

Standalone one-off tools for managing the Supabase project directly. Not part of the deployed
Next.js app — these run locally against `DATABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` and are never
bundled or deployed.

```bash
cd scripts
npm install
cp .env.example .env   # fill in DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

npm run db:migrate     # applies supabase/migrations/*.sql (idempotent — tracks what's applied)
npm run seed:admin     # ADMIN_NAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:admin
```
