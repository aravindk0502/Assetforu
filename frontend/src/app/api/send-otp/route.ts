import { loadDynamicAdminPhones, parsePhonesToLast10 } from '@/app/api/_utils/blobAdminPhones';

export const runtime = 'nodejs';

function normalizeMobile(phoneRaw: string): { mobile: string; local10?: string } {
  const digits = String(phoneRaw || '').replace(/\D/g, '');
  if (digits.length === 10) return { mobile: `91${digits}`, local10: digits };
  if (digits.length >= 11 && digits.length <= 15) return { mobile: digits };
  throw new Error('Valid phone number required');
}

function parsePhones(raw: string | undefined): Set<string> {
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

async function isAdminPhone(last10: string) {
  const envAdmins = parsePhonesToLast10(process.env.ADMIN_PHONES);
  if (envAdmins.has(last10)) return true;
  const dynamic = await loadDynamicAdminPhones();
  return dynamic.includes(last10);
}

function envTrue(raw: string | undefined) {
  if (!raw) return false;
  return ['true', '1', 'yes', 'y', 'on'].includes(raw.trim().toLowerCase());
}

export async function POST(req: Request) {
  try {
    const { phone } = (await req.json()) as { phone?: string };
    if (!phone) return Response.json({ success: false, message: 'Phone is required' }, { status: 400 });

    const { mobile, local10 } = normalizeMobile(phone);

    const apiKey = process.env.MSG91_API_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    const devOtpEnabled = envTrue(process.env.DEV_OTP_ENABLED);
    if (!apiKey || !templateId) {
      // Dev fallback (only allowlisted phones). For admin numbers, allow even if DEV_OTP_ENABLED is not set.
      const allow = parsePhones(process.env.DEV_AUTH_PHONES || process.env.ADMIN_PHONES);
      const last10 = (local10 || mobile).replace(/\D/g, '').slice(-10);
      const isAdminAllowed = await isAdminPhone(last10);
      if ((!allow.size || !allow.has(last10)) && !isAdminAllowed) {
        return Response.json(
          { success: false, message: 'MSG91 is not configured' },
          { status: 500 }
        );
      }

      if (!devOtpEnabled) {
        // If DEV_OTP_ENABLED is off, only allow when the phone is explicitly in ADMIN_PHONES.
        if (!isAdminAllowed) {
          return Response.json(
            { success: false, message: 'MSG91 is not configured' },
            { status: 500 }
          );
        }
      }

      return Response.json({
        success: true,
        message: 'DEV OTP enabled (admin fallback). Use OTP 1234.',
      });
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
    const msg = e instanceof Error ? e.message : 'Failed to send OTP';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}
