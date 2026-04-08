export const runtime = 'nodejs';

import { loadCampaigns } from '@/app/api/_utils/blobCampaigns';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limitRaw = searchParams.get('limit');
  const limit = limitRaw ? Math.max(1, Math.min(200, Number(limitRaw) || 200)) : 200;

  const campaigns = await loadCampaigns();
  const filtered = status ? campaigns.filter((c) => c.status === status) : campaigns;
  return Response.json({ success: true, data: filtered.slice(0, limit) });
}

