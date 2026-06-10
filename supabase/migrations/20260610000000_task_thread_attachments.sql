-- Thread file attachments for Comments & Threads

alter table public.task_attachments
  add column if not exists comment_id uuid references public.task_comments(id) on delete set null,
  add column if not exists file_size bigint;

create index if not exists idx_task_attachments_comment_id
  on public.task_attachments(comment_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('task-attachments', 'task-attachments', true, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "task_attachments_select" on storage.objects;
drop policy if exists "task_attachments_insert" on storage.objects;

create policy "task_attachments_select"
on storage.objects
for select
to public
using (bucket_id = 'task-attachments');

create policy "task_attachments_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'task-attachments');
