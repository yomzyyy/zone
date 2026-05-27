-- ============================================================================
-- Lock down seed_default_columns: drop the caller-supplied user parameter
-- and use auth.uid() directly. The previous signature accepted any UUID and
-- ran as definer, so any authenticated user could call it with a victim's
-- UUID and pollute their board with default columns. Even though RLS blocked
-- data exfiltration, this still violated the "users can only modify their
-- own data" invariant the rest of the schema enforces.
-- ============================================================================

-- Drop the old function so its signature doesn't linger.
drop function if exists public.seed_default_columns(uuid);

create or replace function public.seed_default_columns()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'seed_default_columns: not authenticated';
  end if;

  insert into public.columns (user_id, name, status, position, is_default)
  select uid, 'To Do', 'todo', 0, true
  where not exists (
    select 1 from public.columns
    where user_id = uid and status = 'todo' and is_default = true
  );

  insert into public.columns (user_id, name, status, position, is_default)
  select uid, 'In Progress', 'in_progress', 1, true
  where not exists (
    select 1 from public.columns
    where user_id = uid and status = 'in_progress' and is_default = true
  );

  insert into public.columns (user_id, name, status, position, is_default)
  select uid, 'Done', 'done', 2, true
  where not exists (
    select 1 from public.columns
    where user_id = uid and status = 'done' and is_default = true
  );
end;
$$;
