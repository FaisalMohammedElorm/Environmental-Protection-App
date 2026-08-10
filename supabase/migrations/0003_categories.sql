create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) <= 60),
  slug text not null unique,
  description text check (char_length(description) <= 300),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Same slugify rule as the old Category model's pre('validate') hook:
-- lowercase, non-alphanumeric runs collapsed to a single underscore,
-- leading/trailing underscores trimmed.
create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '_' from regexp_replace(lower(trim(value)), '[^a-z0-9]+', '_', 'g'));
$$;

create or replace function public.categories_set_slug()
returns trigger
language plpgsql
as $$
begin
  new.slug := public.slugify(new.name);
  return new;
end;
$$;

create trigger categories_set_slug
  before insert or update of name on public.categories
  for each row execute function public.categories_set_slug();

create trigger set_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

-- Public reference data — GET /categories is unauthenticated in the
-- current app too, and returns inactive categories as well as active ones.
create policy categories_select_all on public.categories
  for select using (true);

create policy categories_write_admin on public.categories
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
