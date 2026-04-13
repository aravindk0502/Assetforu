export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { randomUUID } from 'crypto';
import { requireAdmin } from '@/app/api/_utils/adminAuth';
import { getClientIp, rateLimitOrThrow, requireServerEnv } from '@/app/api/_utils/security';
import { requireFirebaseAdminApp } from '@/app/api/_utils/firebaseAdmin';
import { loadNotificationTokens } from '@/app/api/_utils/blobNotificationTokens';
import { loadNotificationLogs, saveNotificationLogs } from '@/app/api/_utils/blobNotificationLogs';
import { openSealedString } from '@/app/api/_utils/cryptoSeal';

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

export async function POST(req: Request) {
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
    | { title?: unknown; message?: unknown; link?: unknown; target?: unknown; phones?: unknown }
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
  const records = await loadNotificationTokens();
  const selected =
    target === 'all' ? records : records.filter((r) => phoneList.includes(normalizeLast10(r.phone_last10)));

  const tokens = selected
    .map((r) => openSealedString(secret, r.token_sealed))
    .filter((t): t is string => Boolean(t));

  if (!tokens.length) {
    return Response.json({ success: false, message: 'No registered devices found' }, { status: 400 });
  }

  let success = 0;
  let failure = 0;
  let errorMsg: string | undefined;
  try {
    const app = requireFirebaseAdminApp();
    const res = await app.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body: message || undefined },
      data: link ? { link } : undefined,
      webpush: link ? { fcmOptions: { link } } : undefined,
    });
    success = res.successCount || 0;
    failure = res.failureCount || 0;
  } catch (e: unknown) {
    errorMsg = e instanceof Error ? e.message : 'Failed to send';
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
    failure_count: failure || (errorMsg ? tokens.length : 0),
    error: errorMsg,
    actor_phone_last10: auth.phoneLast10,
  };
  await saveNotificationLogs([log, ...logs].slice(0, 2500));

  if (errorMsg) {
    return Response.json({ success: false, message: errorMsg }, { status: 500 });
  }
  return Response.json({ success: true, data: { success, failure } });
}

