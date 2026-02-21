-- SUPABASE DATABASE SETUP SCRIPT
-- This script replaces the Convex schema with PostgreSQL tables and security policies.

-- 1. CLEAR PREVIOUS DATA (Optional cleanup)
-- WARNING: This will delete all data if you've already started using Supabase.
-- Un-comment the lines below to reset the database.
-- DROP TABLE IF EXISTS monthly_progress CASCADE;
-- DROP TABLE IF EXISTS ai_messages CASCADE;
-- DROP TABLE IF EXISTS diet_plans CASCADE;
-- DROP TABLE IF EXISTS emotional_logs CASCADE;
-- DROP TABLE IF EXISTS personal_memory CASCADE;
-- DROP TABLE IF EXISTS workout_logs CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- 2. CREATE PROFILES TABLE (Extends Supabase Auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    gym_experience TEXT CHECK (gym_experience IN ('newbie', 'casual', 'consistent', 'veteran')),
    weight FLOAT,
    height FLOAT,
    body_fat FLOAT,
    fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    goal TEXT CHECK (goal IN ('muscle_gain', 'fat_loss', 'strength', 'maintenance', 'endurance')),
    training_style TEXT CHECK (training_style IN ('bodybuilding', 'powerlifting', 'functional', 'calisthenics', 'mixed')),
    custom_schedule JSONB,
    days_per_week INTEGER,
    diet_type TEXT CHECK (diet_type IN ('vegetarian', 'non_vegetarian', 'vegan', 'eggetarian')),
    meals_per_day INTEGER,
    city TEXT,
    supplements JSONB,
    wake_up_time TEXT,
    sleep_time TEXT,
    water_intake_goal FLOAT,
    user_type TEXT DEFAULT 'unknown',
    coach_style TEXT DEFAULT 'supportive',
    motivation_trigger TEXT DEFAULT 'consistency',
    response_preference TEXT DEFAULT 'medium',
    psych_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. CREATE WORKOUT LOGS TABLE
CREATE TABLE workout_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date BIGINT NOT NULL,
    split_day TEXT,
    session_index INTEGER,
    exercises JSONB, -- Array of LoggedExercise
    mood_before INTEGER,
    mood_after INTEGER,
    energy_level INTEGER,
    notes TEXT,
    duration INTEGER,
    completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. CREATE PERSONAL MEMORY TABLE
CREATE TABLE personal_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    key TEXT,
    value JSONB,
    date BIGINT,
    narrative TEXT
);

-- 5. CREATE EMOTIONAL LOGS TABLE
CREATE TABLE emotional_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date BIGINT NOT NULL,
    mood INTEGER,
    energy INTEGER,
    stress INTEGER,
    feeling TEXT,
    context TEXT
);

-- 6. CREATE DIET PLANS TABLE
CREATE TABLE diet_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date BIGINT NOT NULL,
    target_calories INTEGER,
    target_protein INTEGER,
    target_carbs INTEGER,
    target_fats INTEGER,
    supplement_protein INTEGER,
    food_protein_target INTEGER,
    carb_cycle_day TEXT,
    meals JSONB
);

-- 7. CREATE AI MESSAGES TABLE
CREATE TABLE ai_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    timestamp BIGINT NOT NULL,
    type TEXT,
    content TEXT,
    context TEXT
);

-- 8. CREATE MONTHLY PROGRESS TABLE
CREATE TABLE monthly_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    month INTEGER NOT NULL,
    consistency_score INTEGER,
    total_workouts INTEGER,
    planned_workouts INTEGER,
    total_volume FLOAT,
    avg_mood FLOAT,
    weight_change FLOAT,
    coach_insight TEXT,
    narrative TEXT
);

-- 8b. CREATE DAILY CHECKINS TABLE (personalized daily planning)
CREATE TABLE daily_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date BIGINT NOT NULL,
    weight FLOAT,
    height FLOAT,
    gym_timing TEXT,
    planned_meals TEXT,
    eaten_meals TEXT,
    supplements_taken TEXT,
    pre_workout_meal TEXT,
    distance_home_to_gym_km FLOAT,
    distance_gym_to_home_km FLOAT,
    transport_mode TEXT,
    mood INTEGER,
    energy INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. SETUP ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- 10. CREATE SECURITY POLICIES
-- Users can only read/write their own data

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own workout logs" ON workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout logs" ON workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own memory" ON personal_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memory" ON personal_memory FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own emotional logs" ON emotional_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emotional logs" ON emotional_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ai messages" ON ai_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai messages" ON ai_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own daily checkins" ON daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily checkins" ON daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add similar policies for diet_plans and monthly_progress if needed

-- 11. MIGRATIONS (Add new columns to existing tables)
-- If the profiles table already exists, run this migration to add gym_experience column:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gym_experience TEXT CHECK (gym_experience IN ('newbie', 'casual', 'consistent', 'veteran'));
-- Set default for existing rows (comment out if you want to require users to fill this in)
-- UPDATE profiles SET gym_experience = 'casual' WHERE gym_experience IS NULL;
