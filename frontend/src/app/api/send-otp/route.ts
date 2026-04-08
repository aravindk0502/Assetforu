export const runtime = 'nodejs';

function normalizeMobile(phoneRaw: string): { mobile: string; local10?: string } {
  const digits = String(phoneRaw || '').replace(/\D/g, '');
  if (digits.length === 10) return { mobile: `91${digits}`, local10: digits };
  if (digits.length >= 11 && digits.length <= 15) return { mobile: digits };
  throw new Error('Valid phone number required');
}

export async function POST(req: Request) {
  try {
    const { phone } = (await req.json()) as { phone?: string };
    if (!phone) return Response.json({ success: false, message: 'Phone is required' }, { status: 400 });

    const { mobile } = normalizeMobile(phone);

    const apiKey = process.env.MSG91_API_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    if (!apiKey || !templateId) {
      return Response.json(
        { success: false, message: 'MSG91 is not configured' },
        { status: 500 }
      );
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

