-- Persist the per-task completed checkbox across devices. Previously this
-- was local-only — sign out + back in on another device would show
-- previously-checked tasks as unchecked.
alter table public.tasks
  add column if not exists completed boolean not null default false;

-- Backfill: tasks currently in the "done" column are treated as completed,
-- matching the self-heal logic the client already runs at mount.
update public.tasks
set completed = true
where status = 'done';
