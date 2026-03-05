# Supabase Setup Guide (Physiq-AI)

## 1) Environment Variables
No Supabase credential env vars are needed because this project uses code-configured credentials in `src/services/firebase.ts`.

Create/update `.env` only for optional sync endpoint:

```env
VITE_USER_SYNC_API_URL=
```

Restart the dev server after editing env vars.

## 2) Auth Configuration (Google + Email)
In Supabase Dashboard:
1. Go to `Authentication -> Providers`.
2. Enable `Email` provider.
3. Enable `Google` provider and add Google client ID/secret.
4. Add redirect URL:
    `http://localhost:3000`
    plus your production domain.

## 3) Database Setup
1. Open Supabase SQL editor.
2. Run `setup_database.sql` from this repo.
3. Confirm tables exist:
    `profiles`, `workout_logs`, `daily_checkins`, `emotional_logs`, `ai_messages`, `food_intake_logs`.

## 4) Why Google Login Failed Before
The app had Firebase auth wiring. It now uses Supabase OAuth and session listeners.
If Google login still fails, check:
- Provider enabled in Supabase.
- Redirect URL matches actual app URL exactly.
- Browser popup/redirect is not blocked.

## 5) Why Saved Responses Were Missing Before
The app writes records to `ai_messages` and profile preferences to `profiles`.
With Supabase, this now depends on RLS policies. The new SQL includes owner-based `SELECT/INSERT/UPDATE/DELETE` policies so users can read their own saved data.

## 6) Post-Setup Verification
1. Sign up/login with Google.
2. Complete onboarding.
3. Open coach chat, send a prompt.
4. Verify a new row appears in `ai_messages` for your `user_id`.
5. Verify `profiles.response_preference` and `profiles.coach_style` update after chat interactions.
