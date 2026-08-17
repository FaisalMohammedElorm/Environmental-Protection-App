-- Supabase-only architecture migration: adds the triggers, functions, and
-- RPCs needed now that the frontend talks to Supabase directly instead of
-- through the (now-removed) Express backend. Express used to enforce a few
-- rules that plain RLS can't express on its own (column-level update
-- restrictions, side-effect notifications, audit logging, and two
-- aggregation-heavy read queries) — this file closes those gaps.
--
-- No new tables: everything below operates on columns that already exist.

-- ============================================================================
-- 1. Column-level guard on reports.
--    RLS's reports_update_own_or_staff (0004_reports.sql) allows any staff
--    member to UPDATE a report, and allows the owner to UPDATE while
--    status = 'new' — but it can't restrict *which columns* each of those
--    callers may touch. Express used to enforce: officers may change
--    status/assigned_to but never content; owners (while new) may change
--    content but never status/assigned_to; only admins are unrestricted.
-- ============================================================================
create or replace function public.reports_guard_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    -- No PostgREST/auth context — a trusted server-side connection
    -- (migration/seed scripts, service-role Server Actions). Unrestricted,
    -- matching how Express's own DATABASE_URL connection was unrestricted.
    return new;
  end if;

  if public.is_admin(auth.uid()) then
    return new;
  end if;

  if public.is_staff(auth.uid()) then
    if new.category_id is distinct from old.category_id
      or new.severity is distinct from old.severity
      or new.description is distinct from old.description
      or new.address is distinct from old.address
      or new.latitude is distinct from old.latitude
      or new.longitude is distinct from old.longitude
      or new.images is distinct from old.images
      or new.reported_by is distinct from old.reported_by
    then
      raise exception 'Officers may only change report status or assignment, not content';
    end if;
    return new;
  end if;

  -- Owner: RLS's USING clause already restricts this branch to
  -- reported_by = auth.uid() and status = 'new'. Content may change;
  -- status/assignment may not.
  if new.status is distinct from old.status or new.assigned_to is distinct from old.assigned_to then
    raise exception 'Only staff may change report status or assignment';
  end if;

  return new;
end;
$$;

create trigger reports_guard_update
  before update on public.reports
  for each row execute function public.reports_guard_update();

-- ============================================================================
-- 2. Notification side effects — previously created by Express as a side
--    effect of updateReportStatus/assignReport/addComment.
-- ============================================================================
create or replace function public.notify_report_status_or_assignment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_officer_name text;
begin
  -- Checked first: the assign flow always sets assigned_to (even when it
  -- also bumps status to 'assigned' in the same statement), so this
  -- reproduces today's "one notification per assign, not two" behavior.
  if new.assigned_to is distinct from old.assigned_to then
    if new.assigned_to is not null then
      select name into v_officer_name from public.profiles where id = new.assigned_to;
      insert into public.notifications (user_id, type, title, body, related_report_id)
      values (
        new.reported_by,
        'report_assigned',
        'Your report was assigned',
        format('Report %s was assigned to %s', new.id, coalesce(v_officer_name, 'an officer')),
        new.id
      );
    end if;
  elsif new.status is distinct from old.status then
    insert into public.notifications (user_id, type, title, body, related_report_id)
    values (
      new.reported_by,
      'report_status_changed',
      'Your report status changed',
      format('Report %s is now "%s"', new.id, replace(new.status::text, '_', ' ')),
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger notify_report_status_or_assignment
  after update of status, assigned_to on public.reports
  for each row execute function public.notify_report_status_or_assignment();

create or replace function public.notify_report_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_report_owner uuid;
begin
  select reported_by into v_report_owner from public.reports where id = new.report_id;

  if v_report_owner is not null and new.author_id is distinct from v_report_owner then
    insert into public.notifications (user_id, type, title, body, related_report_id)
    values (
      v_report_owner,
      'report_comment',
      'New comment on your report',
      format('Someone commented on report %s', new.report_id),
      new.report_id
    );
  end if;
  return new;
end;
$$;

create trigger notify_report_comment
  after insert on public.comments
  for each row execute function public.notify_report_comment();

-- ============================================================================
-- 3. Audit logging — previously written from Express controllers via
--    auditLog.service.ts. actor_name/actor_role are looked up fresh here
--    (Express denormalized them from the JWT-derived request user instead).
-- ============================================================================
create or replace function public.audit_report_changes()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_actor_role user_role;
begin
  if v_actor_id is null then
    return coalesce(new, old);
  end if;

  select name, role into v_actor_name, v_actor_role from public.profiles where id = v_actor_id;
  if v_actor_name is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    insert into public.audit_logs (actor_id, actor_name, actor_role, action, target_type, target_id, metadata)
    values (v_actor_id, v_actor_name, v_actor_role, 'delete_report', 'Report', old.id::text, null);
    return old;
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    insert into public.audit_logs (actor_id, actor_name, actor_role, action, target_type, target_id, metadata)
    values (v_actor_id, v_actor_name, v_actor_role, 'assign_report', 'Report', new.id::text,
            jsonb_build_object('officerId', new.assigned_to));
  elsif new.status is distinct from old.status then
    insert into public.audit_logs (actor_id, actor_name, actor_role, action, target_type, target_id, metadata)
    values (v_actor_id, v_actor_name, v_actor_role, 'update_status', 'Report', new.id::text,
            jsonb_build_object('status', new.status));
  end if;

  return new;
end;
$$;

-- Note: unlike Express (which only audit-logged staff-initiated deletes),
-- this fires on every report delete regardless of actor — the RLS policy
-- already lets an owner delete their own report, and that path deserves an
-- audit trail too. Disclosed intentional behavior improvement.
create trigger audit_report_changes
  after update of status, assigned_to or delete on public.reports
  for each row execute function public.audit_report_changes();

create or replace function public.audit_category_changes()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_actor_role user_role;
  v_action text;
  v_target_id text;
begin
  if v_actor_id is null then
    return coalesce(new, old);
  end if;

  select name, role into v_actor_name, v_actor_role from public.profiles where id = v_actor_id;
  if v_actor_name is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    v_action := 'create_category';
    v_target_id := new.id::text;
  elsif tg_op = 'UPDATE' then
    v_action := 'update_category';
    v_target_id := new.id::text;
  else
    v_action := 'delete_category';
    v_target_id := old.id::text;
  end if;

  insert into public.audit_logs (actor_id, actor_name, actor_role, action, target_type, target_id, metadata)
  values (v_actor_id, v_actor_name, v_actor_role, v_action, 'Category', v_target_id, null);

  return coalesce(new, old);
end;
$$;

create trigger audit_category_changes
  after insert or update or delete on public.categories
  for each row execute function public.audit_category_changes();

create or replace function public.audit_profile_role_changes()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_actor_role user_role;
  v_action text;
begin
  if v_actor_id is null then
    return new;
  end if;

  if new.role is distinct from old.role then
    v_action := 'change_user_role';
  elsif new.is_active is distinct from old.is_active then
    v_action := case when new.is_active then 'activate_user' else 'suspend_user' end;
  else
    return new;
  end if;

  select name, role into v_actor_name, v_actor_role from public.profiles where id = v_actor_id;
  if v_actor_name is null then
    return new;
  end if;

  insert into public.audit_logs (actor_id, actor_name, actor_role, action, target_type, target_id, metadata)
  values (
    v_actor_id, v_actor_name, v_actor_role, v_action, 'User', new.id::text,
    case when new.role is distinct from old.role then jsonb_build_object('role', new.role) else null end
  );

  return new;
end;
$$;

-- Separate AFTER trigger from the existing BEFORE prevent_privilege_escalation
-- trigger (0002_profiles.sql) — that one blocks the change, this one logs it
-- once it's actually happened (e.g. via an admin's own update).
create trigger audit_profile_role_changes
  after update of role, is_active on public.profiles
  for each row execute function public.audit_profile_role_changes();

create or replace function public.audit_settings_changes()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_actor_role user_role;
begin
  if v_actor_id is null then
    return new;
  end if;

  select name, role into v_actor_name, v_actor_role from public.profiles where id = v_actor_id;
  if v_actor_name is null then
    return new;
  end if;

  insert into public.audit_logs (actor_id, actor_name, actor_role, action, target_type, target_id, metadata)
  values (v_actor_id, v_actor_name, v_actor_role, 'update_settings', 'Settings', 'singleton', null);

  return new;
end;
$$;

create trigger audit_settings_changes
  after update on public.settings
  for each row execute function public.audit_settings_changes();

-- ============================================================================
-- 4. admin_list_users — replaces admin.service.ts's listUsers(). Kept as an
--    admin-gated RPC (rather than a plain client SELECT) because
--    profiles_select_staff (needed so officers can see reporter names on
--    reports they triage) is broader than "admin only" — this RPC
--    reproduces Express's narrower admin-only guarantee for the user
--    management screen specifically.
-- ============================================================================
create or replace function public.admin_list_users(
  p_role user_role default null,
  p_search text default null,
  p_page int default 1,
  p_limit int default 25
)
returns table (
  id uuid,
  email text,
  name text,
  phone text,
  avatar_url text,
  role user_role,
  is_active boolean,
  created_at timestamptz,
  reports_filed bigint,
  reports_resolved bigint,
  total_count bigint
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins may list users';
  end if;

  return query
  select
    p.id, p.email, p.name, p.phone, p.avatar_url, p.role, p.is_active, p.created_at,
    case when p.role = 'officer' then (select count(*) from public.reports r where r.reported_by = p.id) end,
    case when p.role = 'officer' then
      (select count(*) from public.reports r where r.assigned_to = p.id and r.status = 'resolved')
    end,
    count(*) over ()
  from public.profiles p
  where (p_role is null or p.role = p_role)
    and (p_search is null or p.search @@ plainto_tsquery('english', p_search))
  order by p.created_at desc
  limit p_limit offset greatest(p_page - 1, 0) * p_limit;
end;
$$;

-- ============================================================================
-- 5. get_analytics_summary — replaces admin.service.ts's getAnalyticsSummary()
--    6-query aggregation. Staff-gated (officer or admin), matching the
--    original GET /analytics/summary route's restrictTo("officer","admin").
--
--    Note: the monthly-trends ordering below (ORDER BY month ASC LIMIT 12)
--    is copied as-is from the original Express query — it returns the
--    OLDEST 12 months of data, not the most recent 12, once the app has
--    more than a year of reports. Reproduced faithfully rather than
--    silently "fixed" during this migration; worth revisiting separately.
-- ============================================================================
create or replace function public.get_analytics_summary()
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_total int;
  v_resolved int;
  v_users int;
  v_category_distribution jsonb;
  v_monthly_trends jsonb;
  v_officer_performance jsonb;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only staff may view analytics';
  end if;

  select count(*) into v_total from public.reports;
  select count(*) into v_resolved from public.reports where status = 'resolved';
  select count(*) into v_users from public.profiles;

  select coalesce(jsonb_agg(jsonb_build_object('category', c.slug, 'count', c.cnt)), '[]'::jsonb)
  into v_category_distribution
  from (
    select cat.slug, count(*) as cnt
    from public.reports r
    join public.categories cat on cat.id = r.category_id
    group by cat.slug
  ) c;

  select coalesce(jsonb_agg(jsonb_build_object('month', m.month, 'reports', m.reports, 'resolved', m.resolved)), '[]'::jsonb)
  into v_monthly_trends
  from (
    select to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
           count(*) as reports,
           count(*) filter (where status = 'resolved') as resolved
    from public.reports
    group by 1
    order by 1
    limit 12
  ) m;

  select coalesce(jsonb_agg(jsonb_build_object('name', o.name, 'resolved', o.resolved, 'avgResponseHours', o.avg_response_hours)), '[]'::jsonb)
  into v_officer_performance
  from (
    select p.name,
           count(*) as resolved,
           round((avg(extract(epoch from (r.resolved_at - r.created_at))) / 3600.0)::numeric, 1) as avg_response_hours
    from public.reports r
    join public.profiles p on p.id = r.assigned_to
    where r.assigned_to is not null and r.status = 'resolved'
    group by p.id, p.name
    order by count(*) desc
    limit 10
  ) o;

  return jsonb_build_object(
    'totalReports', v_total,
    'resolvedReports', v_resolved,
    'pendingReports', v_total - v_resolved,
    'totalUsers', v_users,
    'categoryDistribution', v_category_distribution,
    'monthlyTrends', v_monthly_trends,
    'officerPerformance', v_officer_performance
  );
end;
$$;

-- ============================================================================
-- 6. Settings singleton seed — replaces admin.service.ts's
--    getOrCreateSettingsRow() "auto-create on first read" logic. Seeded once
--    here instead, the same way categories are seeded in 0010.
-- ============================================================================
insert into public.settings (id) values (true) on conflict (id) do nothing;

-- ============================================================================
-- 7. Realtime for notifications — powers the notifications bell/list
--    subscribing to live inserts instead of only refetching on navigation.
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
