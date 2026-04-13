import crypto from 'node:crypto';
import { loadDynamicAdminPhones, parsePhonesToLast10 } from '@/app/api/_utils/blobAdminPhones';
import { getClientIp, isDevOtpAllowed, rateLimitOrThrow, requireServerEnv } from '@/app/api/_utils/security';

export const runtime = 'nodejs';

function normalizeMobile(phoneRaw: string): { mobile: string; local10?: string } {
  const digits = String(phoneRaw || '').replace(/\D/g, '');
  if (digits.length === 10) return { mobile: `91${digits}`, local10: digits };
  if (digits.length >= 11 && digits.length <= 15) return { mobile: digits };
  throw new Error('Valid phone number required');
}

async function getAdminLevel(last10: string): Promise<'owner' | 'team' | null> {
  const envAdmins = parsePhonesToLast10(process.env.ADMIN_PHONES);
  if (envAdmins.has(last10)) return 'owner';
  const dynamic = await loadDynamicAdminPhones();
  if (dynamic.includes(last10)) return 'team';
  return null;
}

function base64Url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwtHS256(payload: Record<string, unknown>, secret: string, expiresInSeconds = 60 * 60 * 24 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const fullPayload = { ...payload, iat, exp };
  const headerPart = base64Url(JSON.stringify(header));
  const payloadPart = base64Url(JSON.stringify(fullPayload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const sig = crypto.createHmac('sha256', secret).update(signingInput).digest();
  return `${signingInput}.${base64Url(sig)}`;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    rateLimitOrThrow({ key: `verify-otp:ip:${ip}`, limit: 30, windowMs: 15 * 60 * 1000 });

    const body = (await req.json()) as {
      phone?: string;
      otp?: string;
      terms_accepted?: boolean;
      admin_mode?: 'company' | 'team';
    };
    const phone = body.phone;
    const otp = body.otp;
    const termsAccepted = Boolean(body.terms_accepted);

    if (!phone || !otp) {
      return Response.json({ success: false, message: 'Phone and OTP are required' }, { status: 400 });
    }

    const { mobile, local10 } = normalizeMobile(phone);

    const apiKey = process.env.MSG91_API_KEY;
    const jwtSecret = requireServerEnv('JWT_SECRET');
    const last10 = (local10 || mobile).replace(/\D/g, '').slice(-10);
    rateLimitOrThrow({ key: `verify-otp:phone:${last10}`, limit: 10, windowMs: 15 * 60 * 1000 });

    const adminLevel = await getAdminLevel(last10);
    const isAdmin = Boolean(adminLevel);

    // If user explicitly selects "Company Admin", require owner-level admin.
    if (body.admin_mode === 'company' && adminLevel !== 'owner') {
      return Response.json({ success: false, message: 'Company admin access is restricted to owner accounts' }, { status: 403 });
    }

    // Dev OTP fallback
    if (!apiKey) {
      if (!isDevOtpAllowed(last10)) {
        return Response.json({ success: false, message: 'MSG91 is not configured' }, { status: 500 });
      }

      // DEV OTP must be explicitly configured to avoid guessable defaults.
      const expected = process.env.DEV_OTP_CODE;
      if (!expected) {
        return Response.json({ success: false, message: 'Server misconfigured: missing DEV_OTP_CODE' }, { status: 500 });
      }
      const provided = String(otp || '').trim();
      const a = Buffer.from(provided);
      const b = Buffer.from(expected);
      const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
      if (!ok) {
        return Response.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
      }

      const id = `phone:${local10 || mobile}`;
      const role = isAdmin ? ('admin' as const) : ('user' as const);
      const user = {
        id,
        phone: local10 || mobile,
        role,
        admin_level: role === 'admin' ? adminLevel : undefined,
        kyc_status: 'pending' as const,
        isNew: true,
      };

      const token = signJwtHS256(
        { sub: id, phone: user.phone, role: user.role, admin_level: user.admin_level, kyc_status: user.kyc_status, termsAccepted },
        jwtSecret
      );

      return Response.json({
        success: true,
        message: 'Logged in successfully',
        token,
        user,
      });
    }

    const url = new URL('https://control.msg91.com/api/v5/otp/verify');
    url.searchParams.set('mobile', mobile);
    url.searchParams.set('otp', String(otp));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        authkey: apiKey,
      },
      cache: 'no-store',
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return Response.json(
        { success: false, message: (data?.message as string) || 'Invalid OTP', details: data },
        { status: 400 }
      );
    }

    const id = `phone:${local10 || mobile}`;
    const role = isAdmin ? ('admin' as const) : ('user' as const);
    const user = {
      id,
      phone: local10 || mobile,
      role,
      admin_level: role === 'admin' ? adminLevel : undefined,
      kyc_status: 'pending' as const,
      isNew: true,
    };

    const token = signJwtHS256(
      { sub: id, phone: user.phone, role: user.role, admin_level: user.admin_level, kyc_status: user.kyc_status, termsAccepted },
      jwtSecret
    );

    return Response.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user,
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
