import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { requireUser } from '@/app/api/_utils/userAuth';
import { getClientIp, rateLimitOrThrow, requireServerEnv } from '@/app/api/_utils/security';
import { loadNotificationTokens, saveNotificationTokens } from '@/app/api/_utils/blobNotificationTokens';
import { sealString } from '@/app/api/_utils/cryptoSeal';

function normalizeLast10(raw: string) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 10) return digits.padStart(10, '0').slice(-10);
  return digits.slice(-10);
}

function validateToken(token: unknown) {
  if (typeof token !== 'string') return null;
  const trimmed = token.trim();
  if (trimmed.length < 20) return null;
  if (trimmed.length > 4096) return null;
  return trimmed;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function handleSaveFcmToken(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });

  try {
    const ip = getClientIp(req);
    rateLimitOrThrow({ key: `fcm-register:ip:${ip}`, limit: 60, windowMs: 60 * 60 * 1000 });
    rateLimitOrThrow({ key: `fcm-register:user:${auth.phoneLast10}`, limit: 30, windowMs: 60 * 60 * 1000 });
  } catch {
    return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { token?: unknown } | null;
  const token = validateToken(body?.token);
  if (!token) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 });

  const secret = requireServerEnv('JWT_SECRET');
  const tokenSealed = sealString(secret, token);
  const tokenHash = hashToken(token);
  const phoneLast10 = normalizeLast10(auth.phoneLast10);
  if (!phoneLast10) return NextResponse.json({ success: false, message: 'Invalid user' }, { status: 401 });
  const userId = String(auth.payload?.sub || auth.payload?.id || '').trim() || undefined;
  const userAgent = String(req.headers.get('user-agent') || '').trim().slice(0, 512) || undefined;
  const devicePlatform = String(req.headers.get('sec-ch-ua-platform') || '').trim().replace(/^"|"$/g, '').slice(0, 64) || undefined;

  const existing = await loadNotificationTokens();
  const now = new Date().toISOString();
  const duplicate = existing.find((r) => r.token_hash === tokenHash);
  const next = existing.filter((r) => r.token_hash !== tokenHash);
  next.push({
    user_id: userId,
    phone_last10: phoneLast10,
    token_hash: tokenHash,
    token_sealed: tokenSealed,
    user_agent: userAgent,
    device_platform: devicePlatform,
    created_at: duplicate?.created_at || now,
    updated_at: now,
  });

  await saveNotificationTokens(next);
  console.log('[FCM] token saved', { userId, phoneLast10, totalTokens: next.length });
  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  return handleSaveFcmToken(req);
}
