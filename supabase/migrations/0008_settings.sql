-- Singleton row: id is a boolean that must be true, so the primary key
-- constraint physically prevents a second row from ever existing.
create table public.settings (
  id boolean primary key default true,
  site_name text not null default 'EcoAlert',
  support_email text not null default 'hello@ecoalert.app',
  auto_assign_reports boolean not null default false,
  report_resolution_sla_hours integer not null default 72,
  allow_public_report_submission boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id)
);

create trigger set_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

alter table public.settings enable row level security;

create policy settings_select_admin on public.settings
  for select using (public.is_admin(auth.uid()));

create policy settings_update_admin on public.settings
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
