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

function envTrue(raw: string | undefined) {
  if (!raw) return false;
  return ['true', '1', 'yes', 'y', 'on'].includes(raw.trim().toLowerCase());
}

function parseIsoMs(raw: string | undefined): number | null {
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}

function normalizeLast10(raw: unknown) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 10) return digits.padStart(10, '0').slice(-10);
  return digits.slice(-10);
}

function constantTimeEqual(aRaw: string, bRaw: string) {
  const a = Buffer.from(String(aRaw || ''), 'utf8');
  const b = Buffer.from(String(bRaw || ''), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
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

    // Break-glass: allow admin login without MSG91 using a long emergency code.
    // Enabled only when EMERGENCY_ADMIN_ENABLED=true AND phone matches EMERGENCY_ADMIN_PHONE.
    const emergencyEnabled = envTrue(process.env.EMERGENCY_ADMIN_ENABLED);
    const emergencyPhone = normalizeLast10(process.env.EMERGENCY_ADMIN_PHONE);
    const emergencyCode = String(process.env.EMERGENCY_ADMIN_CODE || '');
    const emergencyAllowWeak = envTrue(process.env.EMERGENCY_ADMIN_ALLOW_WEAK_CODE);
    const emergencyExpiresAtMs = parseIsoMs(process.env.EMERGENCY_ADMIN_EXPIRES_AT);
    if (emergencyEnabled && emergencyPhone && emergencyPhone === last10) {
      // Only allow for Company Admin flow to avoid accidental use on user login.
      if (body.admin_mode !== 'company') {
        return Response.json({ success: false, message: 'Company admin mode required' }, { status: 400 });
      }
      const trimmedEmergency = emergencyCode.trim();
      const isWeak = trimmedEmergency.length > 0 && trimmedEmergency.length < 16;
      if (!trimmedEmergency) {
        return Response.json({ success: false, message: 'Server misconfigured: EMERGENCY_ADMIN_CODE is missing' }, { status: 500 });
      }
      if (isWeak) {
        if (!emergencyAllowWeak) {
          return Response.json(
            { success: false, message: 'Server misconfigured: EMERGENCY_ADMIN_CODE too short (set a longer code)' },
            { status: 500 }
          );
        }
        // Safety: require an expiry for weak (short) codes so they can’t be left enabled indefinitely.
        const nowMs = Date.now();
        if (!emergencyExpiresAtMs || emergencyExpiresAtMs <= nowMs) {
          return Response.json(
            { success: false, message: 'Server misconfigured: EMERGENCY_ADMIN_EXPIRES_AT is missing/expired' },
            { status: 500 }
          );
        }
        // Hard cap: weak-code window max 24h from now.
        if (emergencyExpiresAtMs - nowMs > 24 * 60 * 60 * 1000) {
          return Response.json(
            { success: false, message: 'Server misconfigured: EMERGENCY_ADMIN_EXPIRES_AT must be within 24h' },
            { status: 500 }
          );
        }
        console.warn(`[EMERGENCY ADMIN] weak code enabled; expires_at=${new Date(emergencyExpiresAtMs).toISOString()}`);
      }
      const ok = constantTimeEqual(String(otp || '').trim(), emergencyCode);
      console.warn(`[EMERGENCY ADMIN] verify attempt phone=${last10} ip=${ip} ok=${ok}`);
      if (!ok) {
        return Response.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
      }

      const id = `phone:${local10 || mobile}`;
      const user = {
        id,
        phone: local10 || mobile,
        role: 'admin' as const,
        admin_level: 'owner' as const,
        kyc_status: 'pending' as const,
        isNew: false,
      };

      const token = signJwtHS256(
        { sub: id, phone: user.phone, role: user.role, admin_level: user.admin_level, kyc_status: user.kyc_status, termsAccepted },
        jwtSecret
      );

      return Response.json({ success: true, message: 'Logged in successfully', token, user });
    }

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
      const ok = constantTimeEqual(provided, expected);
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
