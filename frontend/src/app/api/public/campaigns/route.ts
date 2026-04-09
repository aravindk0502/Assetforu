export const runtime = 'nodejs';

import { loadCampaigns } from '@/app/api/_utils/blobCampaigns';

function normalizeStatus(raw: string | null | undefined) {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return null;
  if (s === 'close') return 'closed';
  if (s === 'active' || s === 'upcoming' || s === 'closed') return s;
  return null;
}

function parseFlexibleDate(raw: unknown): number | null {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct.getTime();

  // Supports "dd/mm/yyyy, hh:mm AM/PM" or "dd-mm-yyyy hh:mm"
  const m = value.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?$/i
  );
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  let hour = Number(m[4] || '0');
  const minute = Number(m[5] || '0');
  const ampm = (m[6] || '').toUpperCase();
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  const d = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

function deriveStatus(c: any) {
  const fromField = normalizeStatus(c?.status) || 'active';
  const endRaw = c?.end_time;
  if (endRaw) {
    const endMs = parseFlexibleDate(endRaw);
    if (endMs && Date.now() > endMs) return 'closed';
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
