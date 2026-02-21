import { type Session, type User } from '@supabase/supabase-js';
import { supabase } from './supabase';

function getDisplayName(user: User): string {
    const metadataName = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name.trim() : '';
    if (metadataName.length > 0) return metadataName;

    const fullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '';
    if (fullName.length > 0) return fullName;

    if (user.email) {
        const localPart = user.email.split('@')[0] ?? 'Athlete';
        return localPart.replace(/[._-]+/g, ' ').trim() || 'Athlete';
    }

    return 'Athlete';
}

export async function ensureUserProfileExists(session: Session): Promise<void> {
    const user = session.user;
    const payload = {
        id: user.id,
        name: getDisplayName(user),
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) {
        throw error;
    }
}

export async function syncUserToBackend(session: Session): Promise<void> {
    const syncUrl = import.meta.env.VITE_USER_SYNC_API_URL;
    if (!syncUrl) return;

    try {
        await fetch(syncUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                id: session.user.id,
                email: session.user.email,
                name: getDisplayName(session.user),
                image: session.user.user_metadata?.avatar_url ?? session.user.user_metadata?.picture ?? null,
            }),
        });
    } catch (error) {
        console.warn('Optional user sync endpoint failed:', error);
    }
}
