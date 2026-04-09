export const runtime = 'nodejs';

import { loadCampaigns } from '@/app/api/_utils/blobCampaigns';

function deriveStatus(c: any) {
  const status = String(c?.status ?? '').trim().toLowerCase();
  const normalized =
    status === 'closed' || status === 'active' || status === 'upcoming'
      ? status
      : status === 'close'
        ? 'closed'
        : 'active';
  const endRaw = c?.end_time;
  if (endRaw) {
    const value = String(endRaw ?? '').trim();
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime()) && Date.now() > direct.getTime()) return 'closed';
    const m = value.match(
      /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?$/i
    );
    if (m) {
      const day = Number(m[1]);
      const month = Number(m[2]);
      const year = Number(m[3]);
      let hour = Number(m[4] || '0');
      const minute = Number(m[5] || '0');
      const ampm = (m[6] || '').toUpperCase();
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
      if (!Number.isNaN(parsed.getTime()) && Date.now() > parsed.getTime()) return 'closed';
    }
  }
  return normalized;
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const campaigns = await loadCampaigns();
  const found = campaigns.find((c) => String(c.id) === String(id));
  if (!found) return Response.json({ success: false, message: 'Campaign not found' }, { status: 404 });
  return Response.json({ success: true, data: { ...(found as any), status: deriveStatus(found as any) } });
}
