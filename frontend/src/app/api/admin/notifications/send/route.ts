export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createHash, randomUUID } from 'crypto';
import { requireAdmin } from '@/app/api/_utils/adminAuth';
import { getClientIp, rateLimitOrThrow, requireServerEnv } from '@/app/api/_utils/security';
import { requireFirebaseAdminApp } from '@/app/api/_utils/firebaseAdmin';
import { loadNotificationTokens, saveNotificationTokens, type NotificationTokenRecord } from '@/app/api/_utils/blobNotificationTokens';
import { loadNotificationLogs, saveNotificationLogs } from '@/app/api/_utils/blobNotificationLogs';
import { openSealedString, sealString } from '@/app/api/_utils/cryptoSeal';

function normalizeLast10(raw: unknown) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 10) return digits.padStart(10, '0').slice(-10);
  return digits.slice(-10);
}

function validateText(value: unknown, max: number) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function validateFcmToken(value: unknown) {
  if (typeof value !== 'string') return '';
  const token = value.trim();
  if (token.length < 20 || token.length > 4096) return '';
  return token;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function maybeLegacyPlainToken(value: string) {
  const trimmed = String(value || '').trim();
  if (trimmed.length < 20 || trimmed.length > 4096) return '';
  // Legacy fallback: some older data may have stored raw tokens.
  if (trimmed.includes(':') || trimmed.startsWith('fcm_')) return trimmed;
  return '';
}

function shouldDeleteToken(code: string) {
  return (
    code === 'messaging/invalid-registration-token' ||
    code === 'messaging/registration-token-not-registered' ||
    code === 'messaging/invalid-argument' ||
    code === 'messaging/mismatched-credential'
  );
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function handleSendPushNotification(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  try {
    const ip = getClientIp(req);
    rateLimitOrThrow({ key: `admin-notify:ip:${ip}`, limit: 120, windowMs: 15 * 60 * 1000 });
    rateLimitOrThrow({ key: `admin-notify:admin:${auth.phoneLast10}`, limit: 60, windowMs: 15 * 60 * 1000 });
  } catch {
    return Response.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as
    | { title?: unknown; message?: unknown; link?: unknown; target?: unknown; phones?: unknown; bootstrapToken?: unknown }
    | null;

  const title = validateText(body?.title, 80);
  const message = validateText(body?.message, 240);
  const link = validateText(body?.link, 2048);
  const target = body?.target === 'phones' ? 'phones' : 'all';

  if (!title) return Response.json({ success: false, message: 'Title is required' }, { status: 400 });

  const phoneList =
    target === 'phones' && Array.isArray(body?.phones)
      ? (body!.phones as any[]).map((p) => normalizeLast10(p)).filter(Boolean)
      : [];

  if (target === 'phones' && !phoneList.length) {
    return Response.json({ success: false, message: 'Select at least one phone' }, { status: 400 });
  }

  const secret = requireServerEnv('JWT_SECRET');
  const bootstrapToken = validateFcmToken(body?.bootstrapToken);
  const records = await loadNotificationTokens();
  const selected =
    target === 'all' ? records : records.filter((r) => phoneList.includes(normalizeLast10(r.phone_last10)));

  const tokenEntries = selected
    .map((r) => {
      const token = openSealedString(secret, r.token_sealed) || maybeLegacyPlainToken(r.token_sealed);
      if (!token) return null;
      return { token, record: r };
    })
    .filter((t): t is { token: string; record: NotificationTokenRecord } => Boolean(t?.token));

  const dedupMap = new Map<string, { token: string; records: NotificationTokenRecord[] }>();
  for (const entry of tokenEntries) {
    const existing = dedupMap.get(entry.token);
    if (existing) existing.records.push(entry.record);
    else dedupMap.set(entry.token, { token: entry.token, records: [entry.record] });
  }
  const dedupedEntries = Array.from(dedupMap.values());
  const tokens = dedupedEntries.map((e) => e.token);
  if (bootstrapToken) tokens.push(bootstrapToken);
  const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));

  if (bootstrapToken) {
    try {
      const tokenHash = hashToken(bootstrapToken);
      const exists = records.some((r) => r.token_hash === tokenHash);
      if (!exists) {
        const now = new Date().toISOString();
        const sealed = sealString(secret, bootstrapToken);
        const next = records.concat({
          user_id: String(auth.payload?.sub || auth.payload?.id || '').trim() || undefined,
          phone_last10: auth.phoneLast10,
          token_hash: tokenHash,
          token_sealed: sealed,
          user_agent: String(req.headers.get('user-agent') || '').trim().slice(0, 512) || undefined,
          device_platform: String(req.headers.get('sec-ch-ua-platform') || '').trim().replace(/^"|"$/g, '').slice(0, 64) || undefined,
          created_at: now,
          updated_at: now,
        } as NotificationTokenRecord);
        await saveNotificationTokens(next);
        console.log('[FCM] bootstrap token persisted from admin send', { phoneLast10: auth.phoneLast10, totalTokens: next.length });
      }
    } catch (e) {
      console.error('[FCM] failed to persist bootstrap token', e);
    }
  }

  if (!uniqueTokens.length) {
    console.error('[FCM] No FCM tokens found. Users have not enabled notifications.');
    return Response.json({ success: false, message: 'No registered devices found' }, { status: 400 });
  }

  let success = 0;
  let failure = 0;
  let errorMsg: string | undefined;
  const badTokens = new Set<string>();
  try {
    const app = requireFirebaseAdminApp();
    for (const part of chunk(uniqueTokens, 500)) {
      const res = await app.messaging().sendEachForMulticast({
        tokens: part,
        notification: { title, body: message || undefined },
        data: link ? { link } : undefined,
        webpush: link ? { fcmOptions: { link } } : undefined,
      });
      success += res.successCount || 0;
      failure += res.failureCount || 0;
      res.responses.forEach((r, idx) => {
        if (r.success) return;
        const code = String(r.error?.code || '');
        if (shouldDeleteToken(code)) badTokens.add(part[idx]);
      });
    }
  } catch (e: unknown) {
    errorMsg = e instanceof Error ? e.message : 'Failed to send';
    console.error('[FCM] push send failed', e);
  }

  if (badTokens.size) {
    try {
      const toDelete = new Set<string>();
      for (const tok of badTokens) {
        const matched = dedupMap.get(tok);
        if (!matched) continue;
        matched.records.forEach((r) => {
          if (r.token_hash) toDelete.add(r.token_hash);
          else toDelete.add(r.token_sealed);
        });
      }
      const cleaned = records.filter((r) => {
        if (r.token_hash) return !toDelete.has(r.token_hash);
        return !toDelete.has(r.token_sealed);
      });
      await saveNotificationTokens(cleaned);
      console.log('[FCM] removed invalid tokens', { removed: records.length - cleaned.length, remaining: cleaned.length });
    } catch (cleanupErr) {
      console.error('[FCM] token cleanup failed', cleanupErr);
    }
  }

  const logs = await loadNotificationLogs();
  const log = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    title,
    body: message || undefined,
    link: link || undefined,
    target,
    target_phones_last10: target === 'phones' ? phoneList : undefined,
    success_count: success,
    failure_count: failure || (errorMsg ? uniqueTokens.length : 0),
    error: errorMsg,
    actor_phone_last10: auth.phoneLast10,
  };
  await saveNotificationLogs([log, ...logs].slice(0, 2500));
  console.log('[FCM] admin send summary', {
    actor: auth.phoneLast10,
    target,
    requestedTokens: uniqueTokens.length,
    success,
    failure,
    removedInvalid: badTokens.size,
  });

  if (errorMsg) {
    return Response.json({ success: false, message: errorMsg }, { status: 500 });
  }
  return Response.json({ success: true, data: { success, failure, log } });
}

export async function POST(req: Request) {
  return handleSendPushNotification(req);
}
