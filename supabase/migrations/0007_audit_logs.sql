create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  -- Nullable + on delete set null: the denormalized actor_name/actor_role
  -- snapshot below preserves the historical record even if the actor's
  -- account is later removed.
  actor_id uuid references public.profiles (id) on delete set null,
  actor_name text not null,
  actor_role user_role not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id);

alter table public.audit_logs enable row level security;

create policy audit_logs_select_admin on public.audit_logs
  for select using (public.is_admin(auth.uid()));

-- No insert/update/delete policy for regular clients — written only by
-- Express (service-role/postgres connection, bypasses RLS).
