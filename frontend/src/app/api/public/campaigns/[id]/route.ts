export const runtime = 'nodejs';

import { loadCampaigns } from '@/app/api/_utils/blobCampaigns';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const campaigns = await loadCampaigns();
  const found = campaigns.find((c) => String(c.id) === String(id));
  if (!found) return Response.json({ success: false, message: 'Campaign not found' }, { status: 404 });
  return Response.json({ success: true, data: found });
}

