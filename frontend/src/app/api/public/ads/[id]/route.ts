export const runtime = 'nodejs';

import { loadAds } from '@/app/api/_utils/blobAds';
import type { AdPlacementBanner } from '@/types';

function isActiveNow(ad: AdPlacementBanner, now = Date.now()) {
  if (!ad.is_active) return false;
  const start = ad.start_time ? new Date(String(ad.start_time)).getTime() : NaN;
  const end = ad.end_time ? new Date(String(ad.end_time)).getTime() : NaN;
  if (!Number.isNaN(start) && now < start) return false;
  if (!Number.isNaN(end) && now > end) return false;
  return true;
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ads = await loadAds();
  const found = ads.find((a) => String(a.id) === String(id));
  if (!found) return Response.json({ success: false, message: 'Ad not found' }, { status: 404 });
  if (!isActiveNow(found)) return Response.json({ success: false, message: 'Ad not active' }, { status: 404 });
  return Response.json({ success: true, data: found });
}

