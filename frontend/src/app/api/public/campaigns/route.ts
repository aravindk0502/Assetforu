export const runtime = 'nodejs';

import { loadCampaigns } from '@/app/api/_utils/blobCampaigns';

function normalizeStatus(raw: string | null | undefined) {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return null;
  if (s === 'close') return 'closed';
  if (s === 'active' || s === 'upcoming' || s === 'closed') return s;
  return null;
}

function deriveStatus(c: any) {
  const fromField = normalizeStatus(c?.status) || 'active';
  const endRaw = c?.end_time;
  if (endRaw) {
    const end = new Date(String(endRaw));
    if (!Number.isNaN(end.getTime()) && Date.now() > end.getTime()) return 'closed';
  }
  return fromField;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = normalizeStatus(searchParams.get('status'));
  const limitRaw = searchParams.get('limit');
  const limit = limitRaw ? Math.max(1, Math.min(200, Number(limitRaw) || 200)) : 200;

  const campaigns = await loadCampaigns();
  const filtered = status
    ? campaigns.filter((c) => {
        const cStatus = deriveStatus(c as any);
        return cStatus === status;
      })
    : campaigns;
  const normalized = filtered.map((c: any) => ({ ...c, status: deriveStatus(c) }));
  return Response.json({ success: true, data: normalized.slice(0, limit) });
}
