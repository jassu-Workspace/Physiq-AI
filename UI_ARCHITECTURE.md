# UI Architecture Guide

## Application Flow
1. `Auth` page handles login/signup.
2. `Onboarding` captures and saves profile data.
3. Main app shell (`App.tsx`) routes between dashboard, workouts, nutrition, coach chat, progress, and exercise library.

## Core Layout
- Sidebar navigation on authenticated screens.
- Page-level card sections with responsive spacing.
- Animated tab transitions using `motion/react`.

## Data-Bound Screens
- `Dashboard`: reads workouts, emotions, and daily check-ins.
- `WorkoutPlan`: writes workout logs and hydration updates.
- `NutritionDashboard`: writes/removes food logs and hydration updates.
- `CoachChat`: writes AI messages and updates profile coaching preferences.

## Persistence Contract
Frontend components call shared data helpers in `src/services/store.ts`.
That store relies on the backend adapter in `src/services/firebase.ts`, which now uses Supabase under the hood.

## UX States
Each primary page supports:
- Loading state
- Empty state
- Success feedback (snackbar/message)
- Failure fallback (console + user-safe message)

## Current Backend Expectations
- User identity comes from Supabase Auth.
- All user rows are keyed by `auth.uid()`.
- RLS must allow owner read/write for all active feature tables.
