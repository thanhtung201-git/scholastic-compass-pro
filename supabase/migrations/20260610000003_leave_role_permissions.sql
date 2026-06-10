alter table public.leave_approve enable row level security;

alter table public.roles
  add column if not exists leave_view_scope text not null default 'self',
  add column if not exists leave_create_scope text not null default 'self',
  add column if not exists leave_approve_scope text not null default 'none',
  add column if not exists leave_approve_levels integer[] null;

do $$
begin
  alter table public.roles
    add constraint roles_leave_view_scope_check
    check (leave_view_scope in ('self', 'department', 'all'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.roles
    add constraint roles_leave_create_scope_check
    check (leave_create_scope in ('self', 'department', 'all'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.roles
    add constraint roles_leave_approve_scope_check
    check (leave_approve_scope in ('none', 'department', 'all'));
exception when duplicate_object then null;
end $$;

update public.roles
set
  leave_view_scope = case
    when level = 1 then 'all'
    when level = 2 then 'department'
    else 'self'
  end,
  leave_create_scope = case
    when level = 1 then 'all'
    when level = 2 then 'department'
    else 'self'
  end,
  leave_approve_scope = case
    when level = 1 then 'all'
    when level = 2 then 'department'
    else 'none'
  end,
  leave_approve_levels = case
    when level = 1 then null
    when level = 2 then array[3]
    else '{}'::integer[]
  end
where level is not null;

create or replace function public.leave_same_department(left_department text, right_department text)
returns boolean
language sql
stable
as $$
  select lower(trim(coalesce(left_department, ''))) = lower(trim(coalesce(right_department, '')))
    and nullif(trim(coalesce(left_department, '')), '') is not null
$$;

create or replace function public.leave_scope_allows(scope text, current_department text, target_department text)
returns boolean
language sql
stable
as $$
  select scope = 'all'
    or (scope = 'department' and public.leave_same_department(current_department, target_department))
$$;

create or replace function public.can_access_employee_for_leave(target_employee_id uuid, leave_action text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  with current_employee as (
    select e.id, e.department, e.role
    from public.employee e
    where e.user_id = auth.uid()
    limit 1
  ),
  current_leave_permission as (
    select
      coalesce(r.leave_view_scope, 'self') as leave_view_scope,
      coalesce(r.leave_create_scope, 'self') as leave_create_scope,
      coalesce(r.leave_approve_scope, 'none') as leave_approve_scope,
      r.leave_approve_levels
    from current_employee ce
    left join public.roles r on r.role_name = ce.role
  ),
  target_employee as (
    select e.id, e.department, e.role
    from public.employee e
    where e.id = target_employee_id
    limit 1
  ),
  target_role as (
    select coalesce(r.level, 3) as level
    from target_employee te
    left join public.roles r on r.role_name = te.role
  )
  select coalesce(bool_or(
    case leave_action
      when 'select' then
        te.id = ce.id
        or public.leave_scope_allows(cr.leave_view_scope, ce.department, te.department)
      when 'insert' then
        te.id = ce.id
        or public.leave_scope_allows(cr.leave_create_scope, ce.department, te.department)
      when 'approve' then
        te.id <> ce.id
        and cr.leave_approve_scope <> 'none'
        and public.leave_scope_allows(cr.leave_approve_scope, ce.department, te.department)
        and (
          cr.leave_approve_levels is null
          or tr.level = any(cr.leave_approve_levels)
        )
      when 'delete' then
        te.id = ce.id
        or (
          cr.leave_approve_scope <> 'none'
          and public.leave_scope_allows(cr.leave_approve_scope, ce.department, te.department)
        )
      else false
    end
  ), false)
  from current_employee ce
  cross join current_leave_permission cr
  cross join target_employee te
  cross join target_role tr
$$;

create or replace function public.enforce_leave_approval_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    if old.status <> 'PENDING' then
      raise exception 'Only pending leave requests can be decided.';
    end if;

    if new.employee_id is distinct from old.employee_id
      or new.reason is distinct from old.reason
      or new.start_date is distinct from old.start_date
      or new.end_date is distinct from old.end_date
      or new.num_days is distinct from old.num_days
      or new.created_at is distinct from old.created_at then
      raise exception 'Leave approval can only change decision fields.';
    end if;

    if new.status not in ('APPROVED', 'REJECTED') then
      raise exception 'Leave approval status must be APPROVED or REJECTED.';
    end if;
  end if;

  return new;
end
$$;

drop trigger if exists enforce_leave_approval_update on public.leave_approve;
create trigger enforce_leave_approval_update
before update on public.leave_approve
for each row
execute function public.enforce_leave_approval_update();

drop policy if exists "employee_own_leave_read" on public.leave_approve;
drop policy if exists "hr_read_all_leave" on public.leave_approve;
drop policy if exists "employee_own_leave_insert" on public.leave_approve;
drop policy if exists "hr_insert_any_leave" on public.leave_approve;
drop policy if exists "hr_update_leave_status" on public.leave_approve;
drop policy if exists "leave_select_policy" on public.leave_approve;
drop policy if exists "leave_insert_policy" on public.leave_approve;
drop policy if exists "leave_update_policy" on public.leave_approve;
drop policy if exists "leave_delete_policy" on public.leave_approve;
drop policy if exists "leave_approve_select_by_role" on public.leave_approve;
drop policy if exists "leave_approve_insert_by_role" on public.leave_approve;
drop policy if exists "leave_approve_insert_self" on public.leave_approve;
drop policy if exists "leave_approve_update_hr" on public.leave_approve;
drop policy if exists "leave_approve_update_by_role" on public.leave_approve;

create policy "leave_approve_select_by_permission"
on public.leave_approve
for select
to authenticated
using (public.can_access_employee_for_leave(employee_id, 'select'));

create policy "leave_approve_insert_by_permission"
on public.leave_approve
for insert
to authenticated
with check (public.can_access_employee_for_leave(employee_id, 'insert'));

create policy "leave_approve_update_by_permission"
on public.leave_approve
for update
to authenticated
using (
  status = 'PENDING'
  and public.can_access_employee_for_leave(employee_id, 'approve')
)
with check (
  status in ('APPROVED', 'REJECTED')
  and public.can_access_employee_for_leave(employee_id, 'approve')
);

create policy "leave_approve_delete_by_permission"
on public.leave_approve
for delete
to authenticated
using (
  status = 'PENDING'
  and public.can_access_employee_for_leave(employee_id, 'delete')
);
