import { getToken } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/lib/firebaseClient';
import { getEnvFirebaseWebConfig } from '@/lib/firebase/config';

type RegisterFcmOptions = {
  authToken: string;
  promptIfNeeded?: boolean;
};

type RegisterFcmResult = {
  ok: boolean;
  reason?: string;
  token?: string;
};

function isValidTokenShape(value: unknown) {
  const token = String(value || '').trim();
  return token.length >= 20 && token.length <= 4096;
}

async function getVapidKey() {
  const envVapid = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
  const fallbackVapid = getEnvFirebaseWebConfig().vapidKey || '';

  function normalize(raw: string) {
    return String(raw || '')
      .trim()
      .replace(/^"+|"+$/g, '')
      .replace(/^'+|'+$/g, '')
      .replace(/\s+/g, '');
  }

  function isLikelyValidVapid(raw: string) {
    const key = normalize(raw);
    if (!key) return false;
    if (!/^[A-Za-z0-9\-_]+$/.test(key)) return false;
    if (key.length < 40) return false;
    // Firebase internally decodes the key using base64url rules.
    // If the normalized length % 4 is 1, decoding is impossible and throws atob errors.
    const b64 = key.replace(/-/g, '+').replace(/_/g, '/');
    if (b64.length % 4 === 1) return false;
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      try {
        const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=');
        window.atob(padded);
      } catch {
        return false;
      }
    }
    return true;
  }

  if (isLikelyValidVapid(envVapid)) return normalize(envVapid);

  try {
    const res = await fetch('/api/public/firebase-config', { cache: 'no-store' });
    const json = (await res.json().catch(() => ({}))) as { data?: { vapidKey?: string } | null };
    const remote = String(json?.data?.vapidKey || '');
    if (isLikelyValidVapid(remote)) return normalize(remote);
  } catch {
    // Ignore and use fallback below.
  }

  if (isLikelyValidVapid(fallbackVapid)) return normalize(fallbackVapid);
  console.warn('[FCM] valid VAPID key not found, will try default getToken flow');
  return '';
}

export async function registerFcmToken(options: RegisterFcmOptions): Promise<RegisterFcmResult> {
  const authToken = String(options.authToken || '').trim();
  if (!authToken) return { ok: false, reason: 'missing-auth-token' };
  if (typeof window === 'undefined') return { ok: false, reason: 'no-window' };
  if (!('serviceWorker' in navigator)) return { ok: false, reason: 'service-worker-not-supported' };
  if (!('Notification' in window)) return { ok: false, reason: 'notification-api-not-supported' };

  let permission = Notification.permission;
  console.log('[FCM] notification permission (before request):', permission);
  if (permission !== 'granted' && options.promptIfNeeded) {
    permission = await Notification.requestPermission().catch(() => 'default');
    console.log('[FCM] notification permission (after request):', permission);
  }
  if (permission !== 'granted') {
    const cached = typeof window !== 'undefined' ? localStorage.getItem('af_fcm_token') : '';
    if (isValidTokenShape(cached)) {
      return { ok: true, token: String(cached).trim(), reason: `using-cached-token-with-permission-${permission}` };
    }
    return { ok: false, reason: `notification-permission-${permission}` };
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) return { ok: false, reason: 'messaging-not-available' };

  const vapidKey = await getVapidKey();

  const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  console.log('[FCM] service worker registered:', swReg.scope);
  let fcmToken: string | null = null;
  let primaryError = '';
  if (vapidKey) {
    try {
      fcmToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
      console.log('[FCM] getToken succeeded with VAPID key');
    } catch (e) {
      primaryError = e instanceof Error ? e.message : String(e || '');
      console.warn('[FCM] getToken with VAPID failed, trying default getToken()', primaryError);
    }
  }

  if (!fcmToken) {
    try {
      fcmToken = await getToken(messaging, { serviceWorkerRegistration: swReg });
      console.log('[FCM] getToken succeeded with default Firebase web push key');
    } catch (e) {
      const fallbackError = e instanceof Error ? e.message : String(e || '');
      const combined = [primaryError, fallbackError].filter(Boolean).join(' | ');
      console.error('[FCM] getToken failed', combined || fallbackError);
      const cached = typeof window !== 'undefined' ? localStorage.getItem('af_fcm_token') : '';
      if (isValidTokenShape(cached)) {
        return { ok: true, token: String(cached).trim(), reason: `using-cached-token-after-gettoken-failure:${combined || 'unknown'}` };
      }
      return { ok: false, reason: combined || fallbackError || 'get-token-failed' };
    }
  }
  if (!fcmToken) return { ok: false, reason: 'empty-fcm-token' };
  console.log('[FCM] generated token:', fcmToken);
  try {
    localStorage.setItem('af_fcm_token', fcmToken);
  } catch {
    // ignore local storage write errors
  }

  const res = await fetch('/api/save-fcm-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token: fcmToken }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[FCM] save token failed', { status: res.status, body });
    return { ok: false, reason: `save-failed-${res.status}` };
  }
  console.log('[FCM] save token api response:', res.status, 'ok');

  return { ok: true, token: fcmToken };
}
