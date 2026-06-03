alter table public.leave_approve enable row level security;

drop policy if exists "leave_approve_select_by_role" on public.leave_approve;
drop policy if exists "leave_approve_insert_by_role" on public.leave_approve;
drop policy if exists "leave_approve_insert_self" on public.leave_approve;
drop policy if exists "leave_approve_update_hr" on public.leave_approve;

create policy "leave_approve_select_by_role"
on public.leave_approve
for select
to authenticated
using (
  exists (
    select 1
    from public.employee current_employee
    where current_employee.user_id = auth.uid()
      and (
        current_employee.role in ('HR Manager', 'HR Staff', 'Director')
        or leave_approve.employee_id = current_employee.id
      )
  )
);

create policy "leave_approve_insert_by_role"
on public.leave_approve
for insert
to authenticated
with check (
  exists (
    select 1
    from public.employee current_employee
    where current_employee.user_id = auth.uid()
      and (
        current_employee.role in ('HR Manager', 'HR Staff')
        or leave_approve.employee_id = current_employee.id
      )
  )
);

create policy "leave_approve_update_hr"
on public.leave_approve
for update
to authenticated
using (
  exists (
    select 1
    from public.employee current_employee
    where current_employee.user_id = auth.uid()
      and current_employee.role in ('HR Manager', 'HR Staff')
  )
)
with check (
  exists (
    select 1
    from public.employee current_employee
    where current_employee.user_id = auth.uid()
      and current_employee.role in ('HR Manager', 'HR Staff')
  )
);
