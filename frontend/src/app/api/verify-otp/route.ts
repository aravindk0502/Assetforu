import crypto from 'node:crypto';

export const runtime = 'nodejs';

function normalizeMobile(phoneRaw: string): { mobile: string; local10?: string } {
  const digits = String(phoneRaw || '').replace(/\D/g, '');
  if (digits.length === 10) return { mobile: `91${digits}`, local10: digits };
  if (digits.length >= 11 && digits.length <= 15) return { mobile: digits };
  throw new Error('Valid phone number required');
}

function parseAdminPhones(raw: string | undefined): Set<string> {
  const set = new Set<string>();
  if (!raw) return set;
  for (const part of raw.split(',')) {
    const digits = part.trim().replace(/\D/g, '');
    if (!digits) continue;
    if (digits.length === 10) set.add(digits);
    else if (digits.length > 10) set.add(digits.slice(-10));
  }
  return set;
}

function parsePhones(raw: string | undefined): Set<string> {
  return parseAdminPhones(raw);
}

function envTrue(raw: string | undefined) {
  if (!raw) return false;
  return ['true', '1', 'yes', 'y', 'on'].includes(raw.trim().toLowerCase());
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
    const body = (await req.json()) as { phone?: string; otp?: string; terms_accepted?: boolean };
    const phone = body.phone;
    const otp = body.otp;
    const termsAccepted = Boolean(body.terms_accepted);

    if (!phone || !otp) {
      return Response.json({ success: false, message: 'Phone and OTP are required' }, { status: 400 });
    }

    const { mobile, local10 } = normalizeMobile(phone);

    const apiKey = process.env.MSG91_API_KEY;
    const devOtpEnabled = envTrue(process.env.DEV_OTP_ENABLED);
    const jwtSecret = process.env.JWT_SECRET || apiKey || 'dev-secret';
    const last10 = (local10 || mobile).replace(/\D/g, '').slice(-10);

    // Dev OTP fallback (explicit opt-in)
    if (!apiKey) {
      if (!devOtpEnabled) return Response.json({ success: false, message: 'MSG91 is not configured' }, { status: 500 });

      const allow = parsePhones(process.env.DEV_AUTH_PHONES || process.env.ADMIN_PHONES);
      if (!allow.size || !allow.has(last10)) {
        return Response.json({ success: false, message: 'OTP is temporarily unavailable for this number' }, { status: 403 });
      }

      const expected = process.env.DEV_OTP_CODE || '123456';
      if (String(otp) !== expected) {
        return Response.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
      }

      const id = `phone:${local10 || mobile}`;
      const adminPhones = parseAdminPhones(process.env.ADMIN_PHONES);
      const role = adminPhones.has(last10) ? ('admin' as const) : ('user' as const);
      const user = {
        id,
        phone: local10 || mobile,
        role,
        kyc_status: 'pending' as const,
        isNew: true,
      };

      const token = signJwtHS256(
        { sub: id, phone: user.phone, role: user.role, kyc_status: user.kyc_status, termsAccepted },
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
    const adminPhones = parseAdminPhones(process.env.ADMIN_PHONES);
    const role = adminPhones.has(last10) ? ('admin' as const) : ('user' as const);
    const user = {
      id,
      phone: local10 || mobile,
      role,
      kyc_status: 'pending' as const,
      isNew: true,
    };

    const token = signJwtHS256(
      { sub: id, phone: user.phone, role: user.role, kyc_status: user.kyc_status, termsAccepted },
      jwtSecret
    );

    return Response.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Verification failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}
