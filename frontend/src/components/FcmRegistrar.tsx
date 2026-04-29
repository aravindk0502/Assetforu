'use client';

import { useEffect, useRef } from 'react';
import { onMessage } from 'firebase/messaging';
import { useAuthStore } from '@/store';
import { registerFcmToken } from '@/lib/fcm/register';
import { getFirebaseMessaging } from '@/lib/firebaseClient';
import { pushClientNotification, reconcileServerNotifications } from '@/lib/fcm/inbox';

const STORAGE_KEY = 'af_fcm_token';

export function FcmRegistrar() {
  const { token } = useAuthStore();
  const isRegisteringRef = useRef(false);
  const foregroundUnsubRef = useRef<(() => void) | null>(null);
  const inboxSyncInFlightRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (isRegisteringRef.current) return;
    isRegisteringRef.current = true;

    (async () => {
      try {
        const result = await registerFcmToken({ authToken: token, promptIfNeeded: true });
        if (!result.ok) {
          console.log('[FCM] silent token registration skipped', result.reason);
          return;
        }
        if (result.token) {
          const existing = localStorage.getItem(STORAGE_KEY);
          if (existing === result.token) {
            console.log('[FCM] token unchanged locally; re-syncing with server');
          }
          localStorage.setItem(STORAGE_KEY, result.token);
        }
        console.log('[FCM] token registered successfully (silent)');
      } catch (error) {
        console.error('[FCM] registrar error', error);
      } finally {
        isRegisteringRef.current = false;
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token || typeof window === 'undefined') return;
    let mounted = true;

    (async () => {
      try {
        const messaging = await getFirebaseMessaging();
        if (!mounted || !messaging) return;
        if (foregroundUnsubRef.current) {
          foregroundUnsubRef.current();
          foregroundUnsubRef.current = null;
        }
        foregroundUnsubRef.current = onMessage(messaging, (payload) => {
          const title = String(payload?.notification?.title || payload?.data?.title || 'Notification').trim();
          const body = String(payload?.notification?.body || payload?.data?.body || payload?.data?.message || '').trim();
          const link = String(payload?.data?.link || payload?.fcmOptions?.link || '').trim();
          pushClientNotification({
            title,
            message: body,
            link: link || undefined,
            createdAt: new Date().toISOString(),
          });
        });
      } catch (error) {
        console.error('[FCM] foreground listener attach failed', error);
      }
    })();

    return () => {
      mounted = false;
      if (foregroundUnsubRef.current) {
        foregroundUnsubRef.current();
        foregroundUnsubRef.current = null;
      }
    };
  }, [token]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const onSwMessage = (event: MessageEvent) => {
      const data = (event as MessageEvent<{ type?: string; payload?: any }>).data;
      if (!data || data.type !== 'AF_FCM_NOTIFICATION') return;
      const payload = data.payload || {};
      const title = String(payload.title || '').trim();
      if (!title) return;
      pushClientNotification({
        title,
        message: String(payload.body || payload.message || '').trim(),
        link: String(payload.link || '').trim() || undefined,
        createdAt: String(payload.createdAt || '').trim() || new Date().toISOString(),
      });
    };
    navigator.serviceWorker.addEventListener('message', onSwMessage as EventListener);
    return () => navigator.serviceWorker.removeEventListener('message', onSwMessage as EventListener);
  }, []);

  useEffect(() => {
    if (!token || typeof window === 'undefined') return;
    let stopped = false;

    const syncServerInbox = async () => {
      if (stopped || inboxSyncInFlightRef.current) return;
      const bearer = token || localStorage.getItem('af_token');
      if (!bearer) return;
      inboxSyncInFlightRef.current = true;
      try {
        const res = await fetch('/api/public/notifications/inbox?limit=30', {
          headers: { authorization: `Bearer ${bearer}` },
          cache: 'no-store',
        });
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          data?: Array<{ id?: string; title?: string; message?: string; link?: string; createdAt?: string }>;
        };
        if (!res.ok || json?.success === false || !Array.isArray(json?.data)) return;
        reconcileServerNotifications(
          json.data.map((item) => ({
            sourceId: String(item?.id || '').trim(),
            title: String(item?.title || '').trim(),
            message: String(item?.message || '').trim(),
            link: String(item?.link || '').trim() || undefined,
            createdAt: String(item?.createdAt || '').trim() || undefined,
          }))
        );
      } catch (error) {
        console.error('[FCM] inbox sync failed', error);
      } finally {
        inboxSyncInFlightRef.current = false;
      }
    };

    syncServerInbox();
    const timer = window.setInterval(syncServerInbox, 8000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [token]);

  return null;
}
