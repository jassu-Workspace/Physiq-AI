# Physiq-AI

AI fitness coaching web app with workouts, nutrition tracking, and adaptive coach chat.

## Stack
- React 19 + TypeScript + Vite
- Tailwind CSS + Motion
- Supabase Auth + Postgres (RLS)
- Gemini API for coach responses

## Features
- Email + Google login
- Onboarding and profile persistence
- Workout logging and history
- Nutrition tracking with food intake logs
- Daily check-ins and hydration tracking
- Coach chat with stored AI message history

## Setup
1. Install dependencies:

```bash
npm install
```

2. Create `.env` only if you need optional backend sync:

```env
VITE_USER_SYNC_API_URL=
```

3. In Supabase SQL editor, run `setup_database.sql`.
4. In Supabase Auth providers, enable Google and Email.
5. Start dev server:

```bash
npm run dev
```

## Important Notes
- Database access is protected via RLS and scoped to `auth.uid()`.
- App code uses a Firebase-compatible API surface internally, now backed by Supabase.
- Google login requires correct redirect URLs in Supabase provider config.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`
