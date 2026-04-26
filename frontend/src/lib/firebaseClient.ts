import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';
import { getEnvFirebaseWebConfig, hasFirebaseCoreConfig, type FirebaseWebConfig } from '@/lib/firebase/config';

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
  return initializeApp(configOverride || getEnvFirebaseWebConfig());
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  let config = getEnvFirebaseWebConfig();
  if (!hasFirebaseCoreConfig(config)) {
    const remote = await getRemoteFirebaseConfig();
    if (!remote) return null;
    config = remote;
  }
  const app = initFirebaseApp(config);
  return getMessaging(app);
}
