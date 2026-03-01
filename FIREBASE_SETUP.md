    # Firebase Setup Guide (Physiq-AI)

    ## 1) Add Web App in Firebase Console
    1. Open Firebase Console and select your project.
    2. Go to **Project settings**.
    3. Under **Your apps**, click **Web (`</>`)**.
    4. Register app (name any). 
    5. Copy Firebase config values.

    ## 2) Add Environment Variables
    Create `.env` from `.env.example`:

    ```env
    VITE_FIREBASE_API_KEY=AIzaSyAc4clE60tecSjz8hToCkMOlFscMfBICsM
    VITE_FIREBASE_AUTH_DOMAIN=physiq-ai-7fa67.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=physiq-ai-7fa67
    VITE_FIREBASE_STORAGE_BUCKET=physiq-ai-7fa67.firebasestorage.app
    VITE_FIREBASE_MESSAGING_SENDER_ID=609171981266
    VITE_FIREBASE_APP_ID=1:609171981266:web:b6e91254d4e26a3dcbfe0b
    VITE_FIREBASE_MEASUREMENT_ID=G-D9ZQPG2JCB
    VITE_FIREBASE_ENABLE_ANALYTICS=true
    VITE_USER_SYNC_API_URL=
    ```

    Restart dev server after editing `.env`.

    ## 3) Enable Authentication
    1. Firebase Console → **Authentication** → **Get started**.
    2. In **Sign-in method**, enable:
    - Email/Password
    - Google
    3. In **Settings** add authorized domains for local and production.

    ## 4) Enable Firestore Database
    1. Firebase Console → **Firestore Database** → **Create database**.
    2. Choose region nearest your users.
    3. Use production mode.

    ## 5) Add Firestore Security Rules
    Use this in Firestore Rules tab:

    ```text
    rules_version = '2';
    service cloud.firestore {
    match /databases/{database}/documents {
        function signedIn() { return request.auth != null; }
        function isOwnerByUid(uid) { return signedIn() && request.auth.uid == uid; }
        function hasOwnUserId() { return signedIn() && request.resource.data.user_id == request.auth.uid; }
        function docIsOwnUserId() { return signedIn() && resource.data.user_id == request.auth.uid; }

        match /profiles/{userId} {
        allow read, create, update: if isOwnerByUid(userId);
        }

        match /workout_logs/{docId} {
        allow create: if hasOwnUserId();
        allow read, update, delete: if docIsOwnUserId();
        }

        match /daily_checkins/{docId} {
        allow create: if hasOwnUserId();
        allow read, update, delete: if docIsOwnUserId();
        }

        match /emotional_logs/{docId} {
        allow create: if hasOwnUserId();
        allow read, update, delete: if docIsOwnUserId();
        }

        match /ai_messages/{docId} {
        allow create: if hasOwnUserId();
        allow read, update, delete: if docIsOwnUserId();
        }

        match /food_intake_logs/{docId} {
        allow create: if hasOwnUserId();
        allow read, update, delete: if docIsOwnUserId();
        }
    }
    }
    ```

    ## 6) Collections Used by App
    - `profiles` (doc id = auth uid)
    - `workout_logs`
    - `daily_checkins`
    - `emotional_logs`
    - `ai_messages`
    - `food_intake_logs`

    ## 6.1) What to store (recommended schema)

    ### `profiles/{uid}`
    Store stable user profile and preferences:
    - `id`, `name`, `age`, `gender`
    - `gym_experience`, `fitness_level`, `goal`, `training_style`
    - `custom_schedule`, `days_per_week`
    - `diet_type`, `meals_per_day`, `city`
    - `supplements`, `psych_state`
    - `user_type`, `coach_style`, `motivation_trigger`, `response_preference`
    - `created_at`, `updated_at`

    ### `workout_logs/{autoId}`
    One document per workout session:
    - `user_id`, `date`, `split_day`, `session_index`
    - `exercises` (array with sets/reps/weights)
    - `mood_before`, `mood_after`, `energy_level`, `duration`, `completed`, `notes`

    ### `daily_checkins/{autoId}`
    One document per day/checkin entry:
    - `user_id`, `date`
    - `weight`, `height`, `gym_timing`
    - `planned_meals`, `eaten_meals`, `supplements_taken`, `pre_workout_meal`
    - `distance_home_to_gym_km`, `distance_gym_to_home_km`, `transport_mode`
    - `mood`, `energy`, `notes`

    ### `emotional_logs/{autoId}`
    - `user_id`, `date`, `mood`, `energy`, `stress`, `feeling`, `context`

    ### `ai_messages/{autoId}`
    - `user_id`, `timestamp`, `type`, `content`, `context`

    ### `food_intake_logs/{autoId}`
    One document per food entry:
    - `user_id`, `food_id`, `name`
    - `quantity_units` (1 unit = 100g), `unit_grams`
    - `calories`, `protein`, `carbs`, `fats`
    - `created_at`, `date_key`
    - `target_calories`, `target_protein`, `target_carbs`, `target_fats` (goal snapshot)
    - `expires_at` (millis timestamp, now + 7 days)

    ## 6.4) Auto-delete after 7 days (required)
    This app writes `expires_at = created_at + 7 days` for each `food_intake_logs` document.

    Recommended cleanup logic:
    1. **Firestore TTL policy** (best):
    - Firebase Console → Firestore → TTL policies
    - Add TTL field: `expires_at`
    - Collection group: `food_intake_logs`

    2. **Client safety cleanup** (already implemented):
    - On nutrition page load, expired entries are deleted if found.
    - UI only shows valid logs from last 7 days.

    ## 6.2) How to store for speed + low cost
    - Keep each document small (avoid very large arrays inside `profiles`).
    - Append event-style data to log collections (`workout_logs`, `daily_checkins`, etc.) instead of rewriting one big document.
    - Query by `user_id` + recent date/timestamp and limit results (already done in app).
    - Use `created_at`/`updated_at` timestamps for sorting and debugging.
    - Keep one profile document per user (`profiles/{uid}`) to avoid extra lookups.
    - If images/files are needed later, store files in Firebase Storage and only keep URLs in Firestore.

    ## 6.3) What NOT to store in client Firestore
    - Never store private secrets (API secret keys, service account keys).
    - Do not store payment/card data.
    - Keep sensitive admin-only data in secure backend services only.

    ## 7) Auto Logout Fix Included
    The app now:
    - Sets Firebase auth persistence to local browser storage.
    - Uses auth state listeners to restore session on refresh.
    - Keeps tokens refreshed during active usage.

    ## 8) Performance Recommendations
    - Keep Firestore and Hosting in nearby region.
    - Deploy frontend to CDN-backed hosting.
    - Add composite indexes only when query patterns need them.
    - Keep documents small and append logs to separate collections.
