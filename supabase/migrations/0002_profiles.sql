create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  phone text,
  avatar_url text,
  role user_role not null default 'citizen',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(email, '')), 'B')
  ) stored
);

create index profiles_role_idx on public.profiles (role);
create index profiles_search_idx on public.profiles using gin (search);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-creates a profile row whenever Supabase Auth creates a new user, so
-- signup always produces a matching profile (mirrors what the old
-- auth.service.ts register() did in a single transaction).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- SECURITY DEFINER helpers so RLS policies on *other* tables (and the
-- policies below) can check the caller's role without recursively
-- re-evaluating profiles' own RLS.
create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role in ('officer', 'admin')
  );
$$;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- Blocks a non-admin from escalating their own privileges via the
-- "update own profile" policy below (which otherwise allows editing any
-- column on your own row). auth.uid() is only non-null when the update
-- comes through PostgREST/Supabase's authenticated client; Express's own
-- connection (the trusted `postgres` role from DATABASE_URL) has no
-- auth.uid() context at all, so this only ever restricts the direct/anon
-- client path — Express's admin service functions are unaffected.
create or replace function public.prevent_privilege_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin(auth.uid()) then
    if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
      raise exception 'Only admins may change role or is_active';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_privilege_escalation();

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

create policy profiles_select_staff on public.profiles
  for select using (public.is_staff(auth.uid()));

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_update_admin on public.profiles
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- No insert policy for regular clients: rows are only created by the
-- handle_new_user trigger (SECURITY DEFINER, bypasses RLS) or Express
-- (service-role/postgres connection, also bypasses RLS).
