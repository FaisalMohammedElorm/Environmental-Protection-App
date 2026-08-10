create table public.comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_role user_role not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_report_created_idx on public.comments (report_id, created_at);

create trigger set_comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

alter table public.comments enable row level security;

-- Comment visibility follows the parent report's visibility: owner or staff.
create policy comments_select_via_report on public.comments
  for select using (
    exists (
      select 1 from public.reports r
      where r.id = comments.report_id
        and (r.reported_by = auth.uid() or public.is_staff(auth.uid()))
    )
  );

create policy comments_insert_via_report on public.comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.reports r
      where r.id = comments.report_id
        and (r.reported_by = auth.uid() or public.is_staff(auth.uid()))
    )
  );

-- No update/delete policy — comments are immutable in the app today.
