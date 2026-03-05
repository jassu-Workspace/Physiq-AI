-- Supabase diagnostics for workout tick persistence
-- Run each query block in Supabase SQL editor.

-- 1) Confirm table exists
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'workout_set_progress';

-- 2) Latest rows (most recent first)
select
  id,
  user_id,
  date_key,
  split_day,
  session_index,
  exercise_id,
  exercise_key,
  set_index,
  completed,
  updated_at
from public.workout_set_progress
order by updated_at desc nulls last
limit 100;

-- 3) Count rows by date
select
  date_key,
  count(*) as rows_count,
  count(*) filter (where completed = true) as completed_rows,
  count(*) filter (where completed = false) as not_completed_rows
from public.workout_set_progress
group by date_key
order by date_key desc;

-- 4) Count rows by exercise for latest date
with latest_day as (
  select max(date_key) as date_key
  from public.workout_set_progress
)
select
  p.exercise_id,
  p.exercise_key,
  count(*) as sets_logged,
  count(*) filter (where p.completed) as completed_sets
from public.workout_set_progress p
join latest_day d on p.date_key = d.date_key
group by p.exercise_id, p.exercise_key
order by sets_logged desc, p.exercise_id;

-- 5) Detect duplicates for same set key (should be 1 row per set)
select
  user_id,
  date_key,
  session_index,
  exercise_key,
  set_index,
  count(*) as duplicate_count
from public.workout_set_progress
group by user_id, date_key, session_index, exercise_key, set_index
having count(*) > 1
order by duplicate_count desc;

-- 6) Verify RLS status + policies
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'workout_set_progress';

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public' and tablename = 'workout_set_progress'
order by policyname;
