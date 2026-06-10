-- Data-driven leave approval permissions.
--
-- Configure these columns on public.roles instead of checking role names:
--   leave_view_scope:    self | department | all
--   leave_create_scope:  self | department | all
--   leave_approve_scope: none | department | all
--   leave_approve_levels: integer[] target role levels this role may approve;
--                         null means any target level within scope.
--
-- Example:
--   update public.roles
--   set leave_view_scope = 'all',
--       leave_create_scope = 'all',
--       leave_approve_scope = 'all',
--       leave_approve_levels = null
--   where role_name = 'People Ops Lead';

\i supabase/migrations/20260610000003_leave_role_permissions.sql
