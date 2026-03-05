-- Physiq-AI Supabase schema (run in Supabase SQL editor)
-- This script is idempotent and aligned with current app writes/reads.

create extension if not exists pgcrypto;

create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text,
    age int,
    gender text,
    weight double precision,
    height double precision,
    body_fat double precision,
    gym_experience text,
    fitness_level text,
    goal text,
    training_style text,
    custom_schedule jsonb,
    days_per_week int,
    diet_type text,
    meals_per_day int,
    city text,
    supplements jsonb,
    wake_up_time text,
    sleep_time text,
    water_intake_goal double precision,
    user_type text default 'unknown',
    coach_style text default 'supportive',
    motivation_trigger text default 'consistency',
    response_preference text default 'medium',
    psych_state jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists workout_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    date bigint not null,
    split_day text,
    session_index int,
    exercises jsonb,
    mood_before int,
    mood_after int,
    energy_level int,
    notes text,
    duration int,
    completed boolean default true,
    created_at timestamptz default now()
);

create table if not exists emotional_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    date bigint not null,
    mood int,
    energy int,
    stress int,
    feeling text,
    context text,
    created_at timestamptz default now()
);

create table if not exists ai_messages (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    timestamp bigint not null,
    type text,
    content text,
    context text,
    created_at timestamptz default now()
);

create table if not exists daily_checkins (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    date bigint not null,
    date_key text,
    weight double precision,
    height double precision,
    gym_timing text,
    planned_meals text,
    eaten_meals text,
    supplements_taken text,
    pre_workout_meal text,
    distance_home_to_gym_km double precision,
    distance_gym_to_home_km double precision,
    transport_mode text,
    mood int,
    energy int,
    hydration_ml int,
    total_ml int,
    hydration_goal_ml int,
    notes text,
    created_at bigint,
    updated_at bigint
);

create table if not exists food_intake_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    food_id text,
    name text,
    quantity_units int,
    unit_grams int,
    calories int,
    protein int,
    carbs int,
    fats int,
    created_at bigint,
    date_key text,
    target_calories int,
    target_protein int,
    target_carbs int,
    target_fats int,
    expires_at bigint
);

create index if not exists idx_workout_logs_user_date on workout_logs(user_id, date desc);
create index if not exists idx_emotional_logs_user_date on emotional_logs(user_id, date desc);
create index if not exists idx_ai_messages_user_ts on ai_messages(user_id, timestamp desc);
create index if not exists idx_daily_checkins_user_date on daily_checkins(user_id, date desc);
create index if not exists idx_daily_checkins_user_date_key on daily_checkins(user_id, date_key);
create index if not exists idx_food_logs_user_created on food_intake_logs(user_id, created_at desc);
create index if not exists idx_food_logs_user_date_key on food_intake_logs(user_id, date_key);
create index if not exists idx_food_logs_expires_at on food_intake_logs(expires_at);

alter table profiles enable row level security;
alter table workout_logs enable row level security;
alter table emotional_logs enable row level security;
alter table ai_messages enable row level security;
alter table daily_checkins enable row level security;
alter table food_intake_logs enable row level security;

drop policy if exists profiles_select_own on profiles;
drop policy if exists profiles_insert_own on profiles;
drop policy if exists profiles_update_own on profiles;

create policy profiles_select_own on profiles
for select using (auth.uid() = id);

create policy profiles_insert_own on profiles
for insert with check (auth.uid() = id);

create policy profiles_update_own on profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists workout_logs_select_own on workout_logs;
drop policy if exists workout_logs_insert_own on workout_logs;
create policy workout_logs_select_own on workout_logs
for select using (auth.uid() = user_id);
create policy workout_logs_insert_own on workout_logs
for insert with check (auth.uid() = user_id);

drop policy if exists emotional_logs_select_own on emotional_logs;
drop policy if exists emotional_logs_insert_own on emotional_logs;
create policy emotional_logs_select_own on emotional_logs
for select using (auth.uid() = user_id);
create policy emotional_logs_insert_own on emotional_logs
for insert with check (auth.uid() = user_id);

drop policy if exists ai_messages_select_own on ai_messages;
drop policy if exists ai_messages_insert_own on ai_messages;
create policy ai_messages_select_own on ai_messages
for select using (auth.uid() = user_id);
create policy ai_messages_insert_own on ai_messages
for insert with check (auth.uid() = user_id);

drop policy if exists daily_checkins_select_own on daily_checkins;
drop policy if exists daily_checkins_insert_own on daily_checkins;
drop policy if exists daily_checkins_update_own on daily_checkins;
create policy daily_checkins_select_own on daily_checkins
for select using (auth.uid() = user_id);
create policy daily_checkins_insert_own on daily_checkins
for insert with check (auth.uid() = user_id);
create policy daily_checkins_update_own on daily_checkins
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists food_logs_select_own on food_intake_logs;
drop policy if exists food_logs_insert_own on food_intake_logs;
drop policy if exists food_logs_delete_own on food_intake_logs;
create policy food_logs_select_own on food_intake_logs
for select using (auth.uid() = user_id);
create policy food_logs_insert_own on food_intake_logs
for insert with check (auth.uid() = user_id);
create policy food_logs_delete_own on food_intake_logs
for delete using (auth.uid() = user_id);
