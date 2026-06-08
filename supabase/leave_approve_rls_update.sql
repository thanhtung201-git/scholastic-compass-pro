-- View Policy
-- level 2 (Manager, Admin, Director Secretary) can view their department
-- HR (level 2 or 3) can view all
-- Level 3 can view themselves
drop policy if exists "leave_approve_select_by_role" on public.leave_approve;

create policy "leave_approve_select_by_role"
on public.leave_approve
for select
to authenticated
using (
  exists (
    select 1
    from public.employee current_employee
    left join public.roles r on r.role_name = current_employee.role
    where current_employee.user_id = auth.uid()
      and (
        -- HR roles can see all
        current_employee.role in ('HR Manager', 'HR Staff')
        -- Level 2 roles can see their own department
        or (r.level = 2 and leave_approve.employee_id in (
             select e2.id from public.employee e2 where lower(trim(e2.department)) = lower(trim(current_employee.department))
           ))
        -- Level 1 (Director) can see all
        or r.level = 1
        -- Everyone can see their own
        or leave_approve.employee_id = current_employee.id
      )
  )
);

-- Update Policy
-- HR roles can update if target is level 2 or 1
-- Level 2 roles can update if target is in their department
drop policy if exists "leave_approve_update_hr" on public.leave_approve;
drop policy if exists "leave_approve_update_by_role" on public.leave_approve;

create policy "leave_approve_update_by_role"
on public.leave_approve
for update
to authenticated
using (
  exists (
    select 1
    from public.employee current_employee
    left join public.roles r on r.role_name = current_employee.role
    where current_employee.user_id = auth.uid()
      and (
        -- HR roles can update Level 1 and 2
        (current_employee.role in ('HR Manager', 'HR Staff') and leave_approve.employee_id in (
             select e2.id from public.employee e2 
             left join public.roles r2 on r2.role_name = e2.role
             where r2.level in (1, 2)
           ))
        -- Level 2 can update Level 3 in their own department
        or (r.level = 2 and leave_approve.employee_id in (
             select e2.id from public.employee e2
             left join public.roles r2 on r2.role_name = e2.role
             where lower(trim(e2.department)) = lower(trim(current_employee.department)) and r2.level = 3
           ))
      )
  )
);
