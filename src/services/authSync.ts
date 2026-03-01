import { type User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

function getDisplayName(user: User): string {
    const displayName = typeof user.displayName === 'string' ? user.displayName.trim() : '';
    if (displayName.length > 0) return displayName;

    if (user.email) {
        const localPart = user.email.split('@')[0] ?? 'Athlete';
        return localPart.replace(/[._-]+/g, ' ').trim() || 'Athlete';
    }

    return 'Athlete';
}

export async function ensureUserProfileExists(user: User): Promise<void> {
    const payload = {
        id: user.uid,
        name: getDisplayName(user),
        updated_at: new Date().toISOString(),
    };

    await setDoc(doc(db, 'profiles', user.uid), payload, { merge: true });
}

export async function syncUserToBackend(user: User): Promise<void> {
    const syncUrl = import.meta.env.VITE_USER_SYNC_API_URL;
    if (!syncUrl) return;

    try {
        const idToken = await user.getIdToken();
        await fetch(syncUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                id: user.uid,
                email: user.email,
                name: getDisplayName(user),
                image: user.photoURL ?? null,
            }),
        });
    } catch (error) {
        console.warn('Optional user sync endpoint failed:', error);
    }
}
