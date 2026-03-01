import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
    browserLocalPersistence,
    getAuth,
    GoogleAuthProvider,
    setPersistence,
    type User,
    type Unsubscribe,
    onIdTokenChanged,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyAc4clE60tecSjz8hToCkMOlFscMfBICsM',
    authDomain: 'physiq-ai-7fa67.firebaseapp.com',
    projectId: 'physiq-ai-7fa67',
    storageBucket: 'physiq-ai-7fa67.firebasestorage.app',
    messagingSenderId: '609171981266',
    appId: '1:609171981266:web:b6e91254d4e26a3dcbfe0b',
    measurementId: 'G-D9ZQPG2JCB',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

googleProvider.setCustomParameters({ prompt: 'select_account' });

let persistenceInit: Promise<void> | null = null;

export function ensureAuthPersistence(): Promise<void> {
    if (!persistenceInit) {
        persistenceInit = setPersistence(auth, browserLocalPersistence)
            .then(() => undefined)
            .catch((error) => {
                console.warn('Failed to set Firebase auth persistence:', error);
            });
    }
    return persistenceInit;
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
            console.warn('Firebase token keep-alive failed:', error);
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
