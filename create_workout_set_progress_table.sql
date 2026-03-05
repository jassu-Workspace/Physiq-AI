-- Creates table for per-set workout tick persistence.
-- Run this file in Supabase SQL editor.

create table if not exists workout_set_progress (
    id text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    date_key text not null,
    split_day text not null,
    session_index int not null default 0,
    exercise_id text not null,
    exercise_key text not null,
    set_index int not null,
    completed boolean not null default false,
    created_at bigint,
    updated_at bigint
);

create index if not exists idx_workout_set_progress_user_day_session
    on workout_set_progress(user_id, date_key, session_index);

create index if not exists idx_workout_set_progress_user_split
    on workout_set_progress(user_id, split_day);

alter table workout_set_progress enable row level security;

drop policy if exists workout_set_progress_select_own on workout_set_progress;
drop policy if exists workout_set_progress_insert_own on workout_set_progress;
drop policy if exists workout_set_progress_update_own on workout_set_progress;

create policy workout_set_progress_select_own on workout_set_progress
for select using (auth.uid() = user_id);

create policy workout_set_progress_insert_own on workout_set_progress
for insert with check (auth.uid() = user_id);

create policy workout_set_progress_update_own on workout_set_progress
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
