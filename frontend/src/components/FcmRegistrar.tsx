'use client';

import { useEffect, useRef } from 'react';
import { getToken } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/lib/firebaseClient';
import { useAuthStore } from '@/store';

const STORAGE_KEY = 'af_fcm_token';

function getVapidKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
}

export function FcmRegistrar() {
  const { token } = useAuthStore();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) return;
        if (!('Notification' in window)) return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const messaging = await getFirebaseMessaging();
        if (!messaging) return;

        const vapidKey = getVapidKey();
        if (!vapidKey) return;

        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const fcmToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
        if (!fcmToken) return;

        const existing = localStorage.getItem(STORAGE_KEY);
        if (existing === fcmToken) return;

        const res = await fetch('/api/public/notifications/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token: fcmToken }),
        });
        if (!res.ok) return;

        localStorage.setItem(STORAGE_KEY, fcmToken);
      } catch {
        // best-effort only
      }
    })();
  }, [token]);

  return null;
}

