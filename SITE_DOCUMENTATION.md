# Site Documentation

## Overview
Physiq-AI is a single-page React application for:
- Authentication and onboarding
- Daily workouts and logging
- Nutrition planning and food intake logs
- Daily check-ins and hydration
- Coach chat and response history

## Backend
The app now uses Supabase for:
- `auth.users` for identity
- Postgres tables for app data
- RLS policies for per-user isolation

All auth/database access flows through `src/services/firebase.ts` (Firebase-compatible interface backed by Supabase).

## Primary Tables
- `profiles`
- `workout_logs`
- `daily_checkins`
- `emotional_logs`
- `ai_messages`
- `food_intake_logs`

## Critical User Flows
1. User signs in (Email or Google OAuth).
2. User profile is created/updated in `profiles`.
3. Onboarding saves schedule, goals, and preference fields.
4. Workout/nutrition/chat actions write logs to their own tables.
5. Dashboard and chat pages read those rows back with `user_id = auth.uid()`.

## Data Visibility Rules
- If writes succeed but reads fail, verify RLS `SELECT` policies.
- If writes fail, verify RLS `INSERT/UPDATE/DELETE` policies.
- If Google login fails, verify provider settings and redirect URLs.

## Operational Checklist
1. Run `setup_database.sql` in Supabase.
2. Verify `src/services/firebase.ts` contains the correct Supabase project URL and anon key.
3. Enable Google provider in Supabase Auth.
4. Verify one full cycle: signup/login -> onboarding -> chat message persisted.
