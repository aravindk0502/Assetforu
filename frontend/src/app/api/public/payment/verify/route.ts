export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import crypto from 'node:crypto';
import { requireUser } from '@/app/api/_utils/userAuth';
import { getClientIp, getServerEnv, rateLimitOrThrow } from '@/app/api/_utils/security';
import { loadTransactions, saveTransactions } from '@/app/api/_utils/blobTransactions';

function safeEqualHex(a: string, b: string) {
  const aBuf = Buffer.from(String(a || ''), 'utf8');
  const bBuf = Buffer.from(String(b || ''), 'utf8');
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  try {
    const ip = getClientIp(req);
    rateLimitOrThrow({ key: `rzp-verify:ip:${ip}`, limit: 60, windowMs: 15 * 60 * 1000 });
    rateLimitOrThrow({ key: `rzp-verify:phone:${auth.phoneLast10}`, limit: 30, windowMs: 15 * 60 * 1000 });

    const keySecret = getServerEnv('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      return Response.json({ success: false, message: 'Payments are not configured' }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      amount_inr?: number;
      notes?: Record<string, string>;
    };

    const orderId = String(body.razorpay_order_id || '').trim();
    const paymentId = String(body.razorpay_payment_id || '').trim();
    const signature = String(body.razorpay_signature || '').trim();
    const amountInr = Number(body.amount_inr || 0);

    if (!orderId || !paymentId || !signature || !Number.isFinite(amountInr) || amountInr <= 0) {
      return Response.json({ success: false, message: 'Invalid payment payload' }, { status: 400 });
    }

    const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    if (!safeEqualHex(signature, expected)) {
      return Response.json({ success: false, message: 'Payment signature verification failed' }, { status: 400 });
    }

    // Best-effort audit trail for admin panel.
    try {
      const txns = await loadTransactions();
      txns.push({
        id: crypto.randomUUID(),
        type: 'payment_verified',
        amount: amountInr,
        credits: amountInr,
        direction: 'credit',
        description: 'Razorpay payment verified',
        reference_id: paymentId,
        status: 'completed',
        created_at: new Date().toISOString(),
        phone_last10: auth.phoneLast10,
      } as any);
      await saveTransactions(txns);
    } catch {
      // ignore audit persistence errors
    }

    return Response.json({
      success: true,
      message: 'Payment verified',
      data: { payment_id: paymentId, order_id: orderId },
    });
  } catch (e) {
    if (e && typeof e === 'object' && (e as any).status === 429) {
      const retryAfter = (e as any).retryAfterSeconds || 60;
      return new Response(JSON.stringify({ success: false, message: 'Too many requests' }), {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': String(retryAfter) },
      });
    }
    const msg = e instanceof Error ? e.message : 'Verification failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

