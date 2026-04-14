export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { getServerEnv } from '@/app/api/_utils/security';

function pick(name: string) {
  return getServerEnv(name);
}

export async function GET() {
  const config = {
    apiKey: pick('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: pick('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: pick('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: pick('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: pick('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: pick('NEXT_PUBLIC_FIREBASE_APP_ID'),
    measurementId: pick('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID') || undefined,
    vapidKey: pick('NEXT_PUBLIC_FIREBASE_VAPID_KEY'),
  };

  const hasCore =
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.storageBucket &&
    config.messagingSenderId &&
    config.appId;

  return Response.json(
    {
      success: hasCore,
      data: hasCore ? config : null,
      message: hasCore ? 'ok' : 'Firebase config missing',
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}

