create table public.reports (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  severity report_severity not null,
  status report_status not null default 'new',
  description text not null check (char_length(description) between 10 and 1000),
  images text[] not null default '{}',
  address text not null check (char_length(address) <= 300),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  reported_by uuid not null references public.profiles (id) on delete restrict,
  assigned_to uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_images_max_8 check (array_length(images, 1) is null or array_length(images, 1) <= 8),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(description, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(address, '')), 'B')
  ) stored
);

create index reports_status_category_severity_idx on public.reports (status, category_id, severity);
create index reports_reported_by_idx on public.reports (reported_by);
create index reports_assigned_to_idx on public.reports (assigned_to);
create index reports_lat_lng_idx on public.reports (latitude, longitude);
create index reports_created_at_idx on public.reports (created_at desc);
create index reports_search_idx on public.reports using gin (search);

create trigger set_reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- Mirrors the old Report model's pre('save') hook: stamp resolved_at the
-- moment status transitions into 'resolved', and only then.
create or replace function public.reports_set_resolved_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'resolved' and old.status is distinct from 'resolved' and new.resolved_at is null then
    new.resolved_at := now();
  end if;
  return new;
end;
$$;

create trigger reports_set_resolved_at
  before update of status on public.reports
  for each row execute function public.reports_set_resolved_at();

alter table public.reports enable row level security;

create policy reports_select_own_or_staff on public.reports
  for select using (reported_by = auth.uid() or public.is_staff(auth.uid()));

create policy reports_insert_own on public.reports
  for insert with check (reported_by = auth.uid());

-- Citizens may only touch their own report while status = 'new' (matches
-- report.service.ts's updateReportDetails rule); staff may always update
-- (status changes, assignment). The finer-grained rule — that officers may
-- change status/assignment but never edit report content, and only admins
-- can edit content past 'new' — is enforced in Express, which is the only
-- writer that isn't a citizen self-editing their own fresh report.
create policy reports_update_own_or_staff on public.reports
  for update
  using ((reported_by = auth.uid() and status = 'new') or public.is_staff(auth.uid()))
  with check (reported_by = auth.uid() or public.is_staff(auth.uid()));

create policy reports_delete_own_or_admin on public.reports
  for delete using (reported_by = auth.uid() or public.is_admin(auth.uid()));
