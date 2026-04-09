export const runtime = 'nodejs';

import type { AdPlacement, AdPlacementBanner } from '@/types';
import { loadAds } from '@/app/api/_utils/blobAds';

function normalizePlacement(raw: string | null | undefined): AdPlacement | null {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return null;
  if (s === 'home_hero' || s === 'home_carousel' || s === 'campaign_cards') return s;
  return null;
}

function isActiveNow(ad: AdPlacementBanner, now = Date.now()) {
  if (!ad.is_active) return false;
  const start = ad.start_time ? new Date(String(ad.start_time)).getTime() : NaN;
  const end = ad.end_time ? new Date(String(ad.end_time)).getTime() : NaN;
  if (!Number.isNaN(start) && now < start) return false;
  if (!Number.isNaN(end) && now > end) return false;
  return true;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placement = normalizePlacement(searchParams.get('placement'));
  const limitRaw = searchParams.get('limit');
  const limit = limitRaw ? Math.max(1, Math.min(50, Number(limitRaw) || 50)) : 50;

  const ads = await loadAds();
  const now = Date.now();
  const filtered = ads
    .filter((a) => isActiveNow(a, now))
    .filter((a) => (placement ? a.placement === placement : true))
    .sort((a, b) => (Number(b.priority || 0) - Number(a.priority || 0)) || String(b.created_at || '').localeCompare(String(a.created_at || '')));

  return Response.json({ success: true, data: filtered.slice(0, limit) });
}

