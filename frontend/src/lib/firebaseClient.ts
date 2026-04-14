import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  vapidKey?: string;
};

function getEnvFirebaseConfig(): FirebaseWebConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

function hasCoreConfig(config: FirebaseWebConfig) {
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.storageBucket &&
      config.messagingSenderId &&
      config.appId
  );
}

let remoteConfigPromise: Promise<FirebaseWebConfig | null> | null = null;
async function getRemoteFirebaseConfig(): Promise<FirebaseWebConfig | null> {
  if (typeof window === 'undefined') return null;
  if (!remoteConfigPromise) {
    remoteConfigPromise = (async () => {
      try {
        const res = await fetch('/api/public/firebase-config', { cache: 'no-store' });
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          data?: FirebaseWebConfig | null;
        };
        if (!res.ok || !json?.success || !json?.data) return null;
        return json.data;
      } catch {
        return null;
      }
    })();
  }
  return remoteConfigPromise;
}

export function initFirebaseApp(configOverride?: FirebaseWebConfig) {
  if (getApps().length) return getApps()[0]!;
  return initializeApp(configOverride || getEnvFirebaseConfig());
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  let config = getEnvFirebaseConfig();
  if (!hasCoreConfig(config)) {
    const remote = await getRemoteFirebaseConfig();
    if (!remote) return null;
    config = remote;
  }
  const app = initFirebaseApp(config);
  return getMessaging(app);
}
