create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null,
  title text not null check (char_length(title) <= 150),
  body text not null check (char_length(body) <= 500),
  is_read boolean not null default false,
  related_report_id uuid references public.reports (id) on delete set null,
  created_at timestamptz not null default now()
);

create index notifications_user_read_created_idx on public.notifications (user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());

create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- No insert/delete policy for regular clients — notifications are only
-- created by Express (service-role/postgres connection, bypasses RLS) as a
-- side effect of report status changes, assignment, and comments.
