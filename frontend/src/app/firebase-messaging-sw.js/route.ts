import { NextResponse } from 'next/server';
import { getServerEnv } from '@/app/api/_utils/security';

function env(name: string) {
  const value = getServerEnv(name);
  return value || '';
}

export const runtime = 'nodejs';

export async function GET() {
  const apiKey = env('NEXT_PUBLIC_FIREBASE_API_KEY');
  const authDomain = env('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  const projectId = env('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  const storageBucket = env('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  const messagingSenderId = env('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  const appId = env('NEXT_PUBLIC_FIREBASE_APP_ID');

  const hasConfig =
    apiKey && authDomain && projectId && storageBucket && messagingSenderId && appId;

  const measurementId = env('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID');

  const js = hasConfig
    ? `
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: ${JSON.stringify(apiKey)},
  authDomain: ${JSON.stringify(authDomain)},
  projectId: ${JSON.stringify(projectId)},
  storageBucket: ${JSON.stringify(storageBucket)},
  messagingSenderId: ${JSON.stringify(messagingSenderId)},
  appId: ${JSON.stringify(appId)},
  measurementId: ${JSON.stringify(measurementId || undefined)},
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload?.notification || {};
  const title = notification.title || 'Notification';
  const options = {
    body: notification.body || '',
    icon: '/favicon.ico',
    data: payload?.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event?.notification?.data?.link || event?.notification?.data?.href;
  if (!url) return;
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      const same = allClients.find((c) => c.url === url);
      if (same) return same.focus();
      return clients.openWindow(url);
    })(),
  );
});
`
    : `
// Firebase Messaging is not configured.
// Set NEXT_PUBLIC_FIREBASE_* env vars and redeploy.
`;

  return new NextResponse(js, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
