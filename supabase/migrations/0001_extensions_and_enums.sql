-- EcoAlert schema — design note on RLS + the Express backend
-- ------------------------------------------------------------
-- Every table below gets RLS enabled with real policies mirroring the
-- application's authorization rules (own-row-or-staff, admin-only, etc).
-- This matters for defense-in-depth: Supabase exposes every table over a
-- public PostgREST API via the anon/authenticated key, independent of
-- whatever the Express backend does.
--
-- The Express backend itself connects with the `postgres` role (the direct
-- DATABASE_URL Supabase issues), which — like any table owner — bypasses
-- RLS by default. Express remains the authorization boundary for anything
-- these policies can't cleanly express (e.g. "citizens may edit report
-- content only while status = 'new', but officers may never edit content
-- at all, only status/assignment"); RLS here protects the direct
-- PostgREST/anon-key path, not the Express path.

create type user_role as enum ('citizen', 'officer', 'admin');
create type report_severity as enum ('low', 'moderate', 'high', 'critical');
create type report_status as enum ('new', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected');
create type notification_type as enum ('report_status_changed', 'report_assigned', 'report_comment', 'system');

-- gen_random_uuid() is built into Postgres core (13+) — no extension needed.

-- Shared updated_at trigger, reused by every table that has one.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
