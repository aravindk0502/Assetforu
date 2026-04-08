export const runtime = 'nodejs';

import { loadCampaigns } from '@/app/api/_utils/blobCampaigns';

function normalizeStatus(raw: string | null | undefined) {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return null;
  if (s === 'close') return 'closed';
  if (s === 'active' || s === 'upcoming' || s === 'closed') return s;
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = normalizeStatus(searchParams.get('status'));
  const limitRaw = searchParams.get('limit');
  const limit = limitRaw ? Math.max(1, Math.min(200, Number(limitRaw) || 200)) : 200;

  const campaigns = await loadCampaigns();
  const filtered = status
    ? campaigns.filter((c) => {
        const cStatus = normalizeStatus((c as any).status) || 'active';
        return cStatus === status;
      })
    : campaigns;
  return Response.json({ success: true, data: filtered.slice(0, limit) });
}
