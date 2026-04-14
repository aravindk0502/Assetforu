export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import crypto from 'node:crypto';
import { requireUser } from '@/app/api/_utils/userAuth';
import { getClientIp, getServerEnv, rateLimitOrThrow } from '@/app/api/_utils/security';
import { loadTransactions, saveTransactions } from '@/app/api/_utils/blobTransactions';

function toInt(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function basicAuth(user: string, pass: string) {
  return Buffer.from(`${user}:${pass}`).toString('base64');
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  try {
    const ip = getClientIp(req);
    rateLimitOrThrow({ key: `rzp-create:ip:${ip}`, limit: 60, windowMs: 15 * 60 * 1000 });
    rateLimitOrThrow({ key: `rzp-create:phone:${auth.phoneLast10}`, limit: 30, windowMs: 15 * 60 * 1000 });

    const keyId = getServerEnv('RAZORPAY_KEY_ID');
    const keySecret = getServerEnv('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      return Response.json({ success: false, message: 'Payments are not configured' }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      amount_inr?: number;
      notes?: Record<string, string>;
    };
    const amountInr = Math.max(1, Math.min(500000, toInt(body.amount_inr, 0)));
    if (!amountInr) return Response.json({ success: false, message: 'Invalid amount' }, { status: 400 });

    const receipt = `af_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const payload = {
      amount: amountInr * 100,
      currency: 'INR',
      receipt,
      notes: {
        phone_last10: auth.phoneLast10,
        ...(body.notes || {}),
      },
    };

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        authorization: `Basic ${basicAuth(keyId, keySecret)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const rzpJson = (await rzpRes.json().catch(() => ({}))) as any;
    if (!rzpRes.ok || !rzpJson?.id) {
      return Response.json(
        { success: false, message: String(rzpJson?.error?.description || rzpJson?.message || 'Failed to create payment order') },
        { status: 400 }
      );
    }

    // Best-effort audit trail for admin panel.
    try {
      const txns = await loadTransactions();
      txns.push({
        id: crypto.randomUUID(),
        type: 'payment_order_created',
        amount: amountInr,
        credits: amountInr,
        direction: 'credit',
        description: 'Razorpay order created',
        reference_id: String(rzpJson.id),
        status: 'created',
        created_at: new Date().toISOString(),
        phone_last10: auth.phoneLast10,
      } as any);
      await saveTransactions(txns);
    } catch {
      // ignore audit persistence errors
    }

    return Response.json({
      success: true,
      data: {
        key_id: keyId,
        order_id: String(rzpJson.id),
        amount_paise: toInt(rzpJson.amount, amountInr * 100),
        currency: String(rzpJson.currency || 'INR'),
      },
    });
  } catch (e) {
    if (e && typeof e === 'object' && (e as any).status === 429) {
      const retryAfter = (e as any).retryAfterSeconds || 60;
      return new Response(JSON.stringify({ success: false, message: 'Too many requests' }), {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': String(retryAfter) },
      });
    }
    const msg = e instanceof Error ? e.message : 'Failed to create payment order';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}
