export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  vapidKey?: string;
};

const PUBLIC_FALLBACK_CONFIG: FirebaseWebConfig = {
  apiKey: 'AIzaSyDxCOcXlbgY9rQQj_GBNy1kQevFBHVQFTo',
  authDomain: 'assetforu1.firebaseapp.com',
  projectId: 'assetforu1',
  storageBucket: 'assetforu1.firebasestorage.app',
  messagingSenderId: '254384892016',
  appId: '1:254384892016:web:d358be8f3732b834966cb5',
  measurementId: 'G-9EE2VEZ6B8',
  vapidKey: 'BFVakhuUjH8I62fp9efgleTFlqm6RXiQxVHdubvyiSEUQV70HoRwPTGI3VJw-redDyk_QE7vqJBngMGOREvA8',
};

export function getEnvFirebaseWebConfig(): FirebaseWebConfig {
  const fromEnv = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined,
  };
  // Use provided public web config as fallback when envs are missing.
  return {
    apiKey: fromEnv.apiKey || PUBLIC_FALLBACK_CONFIG.apiKey,
    authDomain: fromEnv.authDomain || PUBLIC_FALLBACK_CONFIG.authDomain,
    projectId: fromEnv.projectId || PUBLIC_FALLBACK_CONFIG.projectId,
    storageBucket: fromEnv.storageBucket || PUBLIC_FALLBACK_CONFIG.storageBucket,
    messagingSenderId: fromEnv.messagingSenderId || PUBLIC_FALLBACK_CONFIG.messagingSenderId,
    appId: fromEnv.appId || PUBLIC_FALLBACK_CONFIG.appId,
    measurementId: fromEnv.measurementId || PUBLIC_FALLBACK_CONFIG.measurementId,
    vapidKey: fromEnv.vapidKey || PUBLIC_FALLBACK_CONFIG.vapidKey,
  };
}

export function hasFirebaseCoreConfig(config: FirebaseWebConfig) {
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.storageBucket &&
      config.messagingSenderId &&
      config.appId
  );
}
