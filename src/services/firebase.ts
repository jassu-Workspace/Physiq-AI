import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';

const supabaseUrl = 'https://hgbarckxdaoeuscnevmo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnYmFyY2t4ZGFvZXVzY25ldm1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjM5MTIsImV4cCI6MjA4ODI5OTkxMn0.1TgBfuA4QTEOSdL2TZ8P0SiNM9II0Xx12mjtrAyTXwQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const analytics = null;

export type Unsubscribe = () => void;

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    getIdToken: () => Promise<string>;
}

type AuthStateListener = (user: User | null) => void;

export class GoogleAuthProvider {
    private parameters: Record<string, string> = {};

    setCustomParameters(parameters: Record<string, string>) {
        this.parameters = { ...this.parameters, ...parameters };
    }

    getCustomParameters(): Record<string, string> {
        return this.parameters;
    }
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function mapSupabaseUser(user: SupabaseUser | null): User | null {
    if (!user) return null;

    return {
        uid: user.id,
        email: user.email ?? null,
        displayName: (user.user_metadata?.display_name as string | undefined) ?? null,
        photoURL: (user.user_metadata?.avatar_url as string | undefined) ?? null,
        getIdToken: async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return data.session?.access_token ?? '';
        },
    };
}

class AuthCompat {
    currentUser: User | null = null;
    private listeners = new Set<AuthStateListener>();

    constructor() {
        void this.bootstrap();
        supabase.auth.onAuthStateChange((_event, session) => {
            this.currentUser = mapSupabaseUser(session?.user ?? null);
            this.listeners.forEach((listener) => listener(this.currentUser));
        });
    }

    private async bootstrap(): Promise<void> {
        const { data } = await supabase.auth.getSession();
        this.currentUser = mapSupabaseUser(data.session?.user ?? null);
    }

    subscribe(listener: AuthStateListener): Unsubscribe {
        this.listeners.add(listener);
        listener(this.currentUser);
        return () => {
            this.listeners.delete(listener);
        };
    }
}

export const auth = new AuthCompat();
export const db = { provider: 'supabase' };

export const browserLocalPersistence = { mode: 'local' as const };

export async function setPersistence(): Promise<void> {
    // Supabase browser client already persists sessions to localStorage.
}

export async function ensureAuthPersistence(): Promise<void> {
    await setPersistence();
}

export async function createUserWithEmailAndPassword(_auth: AuthCompat, email: string, password: string): Promise<{ user: User }> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    const mapped = mapSupabaseUser(data.user);
    if (!mapped) throw new Error('Sign up failed: no user returned.');
    return { user: mapped };
}

export async function signInWithEmailAndPassword(_auth: AuthCompat, email: string, password: string): Promise<{ user: User }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const mapped = mapSupabaseUser(data.user);
    if (!mapped) throw new Error('Login failed: no user returned.');
    return { user: mapped };
}

export async function sendEmailVerification(_user?: User): Promise<void> {
    // Supabase handles email verification via auth configuration.
}

export async function updateProfile(_user: User, payload: { displayName?: string }): Promise<void> {
    const { error } = await supabase.auth.updateUser({
        data: {
            display_name: payload.displayName,
        },
    });
    if (error) throw error;
}

async function oauthSignIn(provider: GoogleAuthProvider): Promise<void> {
    const queryParams = provider.getCustomParameters();
    const redirectTo = 'https://physiq-ai.onrender.com';
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo,
            queryParams,
        },
    });
    if (error) throw error;
}

export async function signInWithPopup(_auth: AuthCompat, provider: GoogleAuthProvider): Promise<void> {
    await oauthSignIn(provider);
}

export async function signInWithRedirect(_auth: AuthCompat, provider: GoogleAuthProvider): Promise<void> {
    await oauthSignIn(provider);
}

export async function signOut(_auth: AuthCompat): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export function onAuthStateChanged(authClient: AuthCompat, callback: AuthStateListener): Unsubscribe {
    return authClient.subscribe(callback);
}

export function onIdTokenChanged(authClient: AuthCompat, callback: AuthStateListener): Unsubscribe {
    return authClient.subscribe(callback);
}

type CollectionRef = { table: string };
type DocRef = { table: string; id: string };
type WhereClause = { type: 'where'; field: string; op: '=='; value: unknown };
type QueryRef = { table: string; clauses: WhereClause[] };

type QueryResultDoc = {
    id: string;
    data: () => Record<string, any>;
};

type QuerySnapshot = {
    docs: QueryResultDoc[];
    empty: boolean;
};

type DocSnapshot = {
    exists: () => boolean;
    data: () => Record<string, any> | undefined;
};

function normalizeRow(row: Record<string, any>): Record<string, any> {
    if (row.id == null && row.user_id != null) {
        return { ...row, id: String(row.user_id) };
    }
    return row;
}

export function collection(_db: unknown, table: string): CollectionRef {
    return { table };
}

export function doc(a: unknown, b?: string, c?: string): DocRef {
    if (typeof (a as CollectionRef)?.table === 'string' && b === undefined) {
        const col = a as CollectionRef;
        return { table: col.table, id: crypto.randomUUID() };
    }

    if (typeof b === 'string' && typeof c === 'string') {
        return { table: b, id: c };
    }

    throw new Error('Invalid doc() invocation.');
}

export function where(field: string, op: '==', value: unknown): WhereClause {
    return { type: 'where', field, op, value };
}

export function query(col: CollectionRef, ...clauses: WhereClause[]): QueryRef {
    return { table: col.table, clauses };
}

export async function addDoc(col: CollectionRef, payload: Record<string, any>): Promise<{ id: string }> {
    const id = crypto.randomUUID();
    const row = { id, ...payload };
    const { error } = await supabase.from(col.table).insert(row);
    if (error) throw error;
    return { id };
}

export async function setDoc(ref: DocRef, payload: Record<string, any>, options?: { merge?: boolean }): Promise<void> {
    let rowToSave: Record<string, any> = { ...payload, id: ref.id };

    if (options?.merge) {
        const { data, error } = await supabase
            .from(ref.table)
            .select('*')
            .eq('id', ref.id)
            .maybeSingle();

        if (error) throw error;
        rowToSave = { ...(data ?? {}), ...payload, id: ref.id };
    }

    const { error } = await supabase.from(ref.table).upsert(rowToSave, { onConflict: 'id' });
    if (error) throw error;
}

export async function getDoc(ref: DocRef): Promise<DocSnapshot> {
    const { data, error } = await supabase
        .from(ref.table)
        .select('*')
        .eq('id', ref.id)
        .maybeSingle();

    if (error) throw error;
    const normalized = data ? normalizeRow(data) : undefined;

    return {
        exists: () => Boolean(normalized),
        data: () => normalized,
    };
}

export async function getDocs(ref: CollectionRef | QueryRef): Promise<QuerySnapshot> {
    const table = 'clauses' in ref ? ref.table : ref.table;
    let stmt = supabase.from(table).select('*');

    if ('clauses' in ref) {
        for (const clause of ref.clauses) {
            if (clause.op !== '==') {
                throw new Error(`Unsupported operator: ${clause.op}`);
            }
            stmt = stmt.eq(clause.field, clause.value as any);
        }
    }

    const { data, error } = await stmt;
    if (error) throw error;

    const docs: QueryResultDoc[] = (data ?? []).map((row: any) => {
        const normalized = normalizeRow(row);
        return {
            id: String(normalized.id),
            data: () => normalized,
        };
    });

    return {
        docs,
        empty: docs.length === 0,
    };
}

export async function deleteDoc(ref: DocRef): Promise<void> {
    const { error } = await supabase.from(ref.table).delete().eq('id', ref.id);
    if (error) throw error;
}

let keepAliveInterval: number | null = null;
let keepAliveUnsub: Unsubscribe | null = null;
let visibilityHandler: (() => void) | null = null;

export function startAuthKeepAlive(): void {
    if (keepAliveInterval !== null) return;

    const refreshToken = async (user: User | null) => {
        if (!user) return;
        try {
            await user.getIdToken();
        } catch (error) {
            console.warn('Auth token keep-alive failed:', error);
        }
    };

    keepAliveUnsub = onIdTokenChanged(auth, (user) => {
        void refreshToken(user);
    });

    keepAliveInterval = window.setInterval(() => {
        void refreshToken(auth.currentUser);
    }, 10 * 60 * 1000);

    visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
            void refreshToken(auth.currentUser);
        }
    };

    document.addEventListener('visibilitychange', visibilityHandler);
}

export let stopAuthKeepAlive = (): void => {
    if (keepAliveInterval !== null) {
        window.clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
    if (keepAliveUnsub) {
        keepAliveUnsub();
        keepAliveUnsub = null;
    }
    if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
        visibilityHandler = null;
    }
};
