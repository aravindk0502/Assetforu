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
    const end = new Date(String(endRaw));
    if (!Number.isNaN(end.getTime()) && Date.now() > end.getTime()) return 'closed';
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
