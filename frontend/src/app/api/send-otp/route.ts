import crypto from 'node:crypto';
import { getClientIp, getServerEnv, isDevOtpAllowed, rateLimitOrThrow, requireServerEnv } from '@/app/api/_utils/security';

export const runtime = 'nodejs';

function normalizeMobile(phoneRaw: string): { mobile: string; local10?: string } {
  const digits = String(phoneRaw || '').replace(/\D/g, '');
  if (digits.length === 10) return { mobile: `91${digits}`, local10: digits };
  if (digits.length >= 11 && digits.length <= 15) return { mobile: digits };
  throw new Error('Valid phone number required');
}

function base64Url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signOtpChallenge(payload: Record<string, unknown>, secret: string) {
  const payloadPart = base64Url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(payloadPart).digest();
  return `${payloadPart}.${base64Url(sig)}`;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    rateLimitOrThrow({ key: `send-otp:ip:${ip}`, limit: 30, windowMs: 15 * 60 * 1000 });

    const { phone } = (await req.json()) as { phone?: string };
    if (!phone) return Response.json({ success: false, message: 'Phone is required' }, { status: 400 });

    const { mobile, local10 } = normalizeMobile(phone);

    const apiKey = getServerEnv('MSG91_API_KEY');
    const templateId = getServerEnv('MSG91_TEMPLATE_ID');
    const flowId = getServerEnv('MSG91_FLOW_ID');
    const senderId = getServerEnv('MSG91_SENDER_ID');
    const route = getServerEnv('MSG91_ROUTE');
    const last10 = (local10 || mobile).replace(/\D/g, '').slice(-10);
    rateLimitOrThrow({ key: `send-otp:phone:${last10}`, limit: 10, windowMs: 15 * 60 * 1000 });

    // Emergency env-driven fallback.
    const emergencyEnabled = envTrue(process.env.EMERGENCY_ADMIN_ENABLED);
    const emergencyPhone = String(process.env.EMERGENCY_ADMIN_PHONE || '').replace(/\D/g, '').slice(-10);
    if (emergencyEnabled && emergencyPhone && last10 === emergencyPhone) {
      console.warn(`[EMERGENCY ADMIN] send-otp bypass for phone=${last10} ip=${ip}`);
      return Response.json({ success: true, message: 'OTP sent' });
    }

    if (!apiKey || (!flowId && !templateId)) {
      if (!isDevOtpAllowed(last10)) {
        return Response.json(
          {
            success: false,
            message:
              'MSG91 is not configured. If you are the Company Admin, enable Emergency Admin env vars in Vercel (Production) and redeploy.',
          },
          { status: 500 }
        );
      }

      const devOtp = process.env.DEV_OTP_CODE;
      if (!devOtp) {
        return Response.json({ success: false, message: 'Server misconfigured: missing DEV_OTP_CODE' }, { status: 500 });
      }

      // Log DEV OTP only on the server, only in non-production environments.
      console.info(`[DEV OTP] phone=${last10} otp=${devOtp}`);

      return Response.json({
        success: true,
        message: `OTP sent (dev mode). Use code: ${devOtp}`,
        data: { dev_mode: true },
      });
    }

    if (flowId) {
      const otpCode = String(crypto.randomInt(1000, 10000));
      const otpVarKey = String(process.env.MSG91_FLOW_OTP_VAR || 'OTP').trim() || 'OTP';
      const payload: Record<string, unknown> = {
        flow_id: flowId,
        mobile,
        mobiles: mobile,
      };
      payload[otpVarKey] = otpCode;
      if (otpVarKey !== 'OTP') payload.OTP = otpCode;
      if (otpVarKey !== 'otp') payload.otp = otpCode;

      const res = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authkey: apiKey,
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      console.info('[MSG91 FLOW SEND OTP]', {
        mobile,
        type: data?.type,
        message: data?.message,
        request_id: data?.request_id,
      });
      const msg91Type = String(data?.type || '').toLowerCase();
      if (!res.ok || msg91Type !== 'success') {
        return Response.json(
          { success: false, message: (data?.message as string) || 'Failed to send OTP', details: data },
          { status: 400 }
        );
      }

      const jwtSecret = requireServerEnv('JWT_SECRET');
      const expiresAt = Date.now() + 10 * 60 * 1000;
      const challenge = signOtpChallenge({ p: last10, o: otpCode, e: expiresAt }, jwtSecret);
      return new Response(JSON.stringify({ success: true, message: 'OTP sent' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'set-cookie': `af_otp_challenge=${challenge}; Max-Age=600; Path=/; HttpOnly; SameSite=Lax; Secure`,
        },
      });
    }

    const url = new URL('https://control.msg91.com/api/v5/otp');
    url.searchParams.set('template_id', templateId);
    url.searchParams.set('mobile', mobile);
    url.searchParams.set('authkey', apiKey);
    if (senderId) url.searchParams.set('sender', senderId);
    if (route) url.searchParams.set('route', route);

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authkey: apiKey,
      },
      body: JSON.stringify({}),
      cache: 'no-store',
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    console.info('[MSG91 TEMPLATE SEND OTP]', {
      mobile,
      type: data?.type,
      message: data?.message,
      request_id: data?.request_id,
    });
    const msg91Type = String(data?.type || '').toLowerCase();
    if (!res.ok || msg91Type !== 'success') {
      return Response.json(
        { success: false, message: (data?.message as string) || 'Failed to send OTP', details: data },
        { status: 400 }
      );
    }

    return Response.json({ success: true, message: 'OTP sent' });
  } catch (e) {
    if (e && typeof e === 'object' && (e as any).status === 429) {
      const retryAfter = (e as any).retryAfterSeconds || 60;
      return new Response(JSON.stringify({ success: false, message: 'Too many requests' }), {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': String(retryAfter) },
      });
    }
    const msg = e instanceof Error ? e.message : 'Failed to send OTP';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

function envTrue(raw: string | undefined) {
  if (!raw) return false;
  return ['true', '1', 'yes', 'y', 'on'].includes(raw.trim().toLowerCase());
}
