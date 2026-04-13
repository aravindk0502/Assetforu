import { getClientIp, isDevOtpAllowed, rateLimitOrThrow } from '@/app/api/_utils/security';

export const runtime = 'nodejs';

function normalizeMobile(phoneRaw: string): { mobile: string; local10?: string } {
  const digits = String(phoneRaw || '').replace(/\D/g, '');
  if (digits.length === 10) return { mobile: `91${digits}`, local10: digits };
  if (digits.length >= 11 && digits.length <= 15) return { mobile: digits };
  throw new Error('Valid phone number required');
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    rateLimitOrThrow({ key: `send-otp:ip:${ip}`, limit: 30, windowMs: 15 * 60 * 1000 });

    const { phone } = (await req.json()) as { phone?: string };
    if (!phone) return Response.json({ success: false, message: 'Phone is required' }, { status: 400 });

    const { mobile, local10 } = normalizeMobile(phone);

    const apiKey = process.env.MSG91_API_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    const last10 = (local10 || mobile).replace(/\D/g, '').slice(-10);
    rateLimitOrThrow({ key: `send-otp:phone:${last10}`, limit: 10, windowMs: 15 * 60 * 1000 });

    // Break-glass: allow proceeding without MSG91 so the verify step can use EMERGENCY_ADMIN_CODE.
    const emergencyEnabled = envTrue(process.env.EMERGENCY_ADMIN_ENABLED);
    const emergencyPhone = String(process.env.EMERGENCY_ADMIN_PHONE || '').replace(/\D/g, '').slice(-10);
    if (emergencyEnabled && emergencyPhone && last10 === emergencyPhone) {
      console.warn(`[EMERGENCY ADMIN] send-otp bypass for phone=${last10} ip=${ip}`);
      return Response.json({ success: true, message: 'OTP sent' });
    }

    if (!apiKey || !templateId) {
      if (!isDevOtpAllowed(last10)) {
        return Response.json({ success: false, message: 'MSG91 is not configured' }, { status: 500 });
      }

      const devOtp = process.env.DEV_OTP_CODE;
      if (!devOtp) {
        return Response.json({ success: false, message: 'Server misconfigured: missing DEV_OTP_CODE' }, { status: 500 });
      }

      // Log DEV OTP only on the server, only in non-production environments.
      console.info(`[DEV OTP] phone=${last10} otp=${devOtp}`);

      return Response.json({ success: true, message: 'OTP sent' });
    }

    const url = new URL('https://control.msg91.com/api/v5/otp');
    url.searchParams.set('template_id', templateId);
    url.searchParams.set('mobile', mobile);
    url.searchParams.set('authkey', apiKey);

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
    if (!res.ok) {
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
