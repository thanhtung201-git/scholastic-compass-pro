-- Allow all users to read thread attachments via public URLs

drop policy if exists "task_attachments_select" on storage.objects;

create policy "task_attachments_select"
on storage.objects
for select
to public
using (bucket_id = 'task-attachments');
