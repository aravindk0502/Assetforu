export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getServerEnv } from '@/app/api/_utils/security';
import { getEnvFirebaseWebConfig, hasFirebaseCoreConfig } from '@/lib/firebase/config';

function pick(name: string) {
  return getServerEnv(name);
}

export async function GET() {
  const config = {
    apiKey: pick('NEXT_PUBLIC_FIREBASE_API_KEY') || getEnvFirebaseWebConfig().apiKey,
    authDomain: pick('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') || getEnvFirebaseWebConfig().authDomain,
    projectId: pick('NEXT_PUBLIC_FIREBASE_PROJECT_ID') || getEnvFirebaseWebConfig().projectId,
    storageBucket: pick('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') || getEnvFirebaseWebConfig().storageBucket,
    messagingSenderId: pick('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') || getEnvFirebaseWebConfig().messagingSenderId,
    appId: pick('NEXT_PUBLIC_FIREBASE_APP_ID') || getEnvFirebaseWebConfig().appId,
    measurementId: pick('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID') || getEnvFirebaseWebConfig().measurementId || undefined,
    vapidKey: pick('NEXT_PUBLIC_FIREBASE_VAPID_KEY') || getEnvFirebaseWebConfig().vapidKey,
  };

  const hasCore = hasFirebaseCoreConfig(config as any);

  return Response.json(
    {
      success: hasCore,
      data: hasCore ? config : null,
      message: hasCore ? 'ok' : 'Firebase config missing',
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}
