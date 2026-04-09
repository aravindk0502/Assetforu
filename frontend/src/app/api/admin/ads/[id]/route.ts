export const runtime = 'nodejs';

import type { AdPlacement, AdPlacementBanner, AdPropertyDetails } from '@/types';
import { verifyJwtHS256 } from '@/app/api/_utils/jwt';
import { loadAds, saveAds } from '@/app/api/_utils/blobAds';

function getBearer(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim();
}

function requireAdmin(req: Request) {
  const token = getBearer(req);
  const secret = process.env.JWT_SECRET || process.env.MSG91_API_KEY || 'dev-secret';
  if (!token) return { ok: false as const, status: 401, message: 'No token provided' };
  const payload = verifyJwtHS256(token, secret);
  if (!payload) return { ok: false as const, status: 401, message: 'Invalid or expired token' };
  if (payload.role !== 'admin') return { ok: false as const, status: 403, message: 'Admin access required' };
  return { ok: true as const };
}

function normalizeString(input: unknown) {
  return String(input ?? '').trim();
}

function normalizePlacement(raw: unknown): AdPlacement | null {
  const s = normalizeString(raw).toLowerCase();
  if (s === 'home_hero' || s === 'home_carousel' || s === 'campaign_cards') return s as AdPlacement;
  return null;
}

function normalizeIsoOrNull(raw: unknown) {
  const v = normalizeString(raw);
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function normalizeProperty(raw: unknown): AdPropertyDetails | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  const typeRaw = normalizeString(obj.type).toLowerCase();
  const type = typeRaw === 'sale' || typeRaw === 'rent' ? (typeRaw as any) : undefined;
  const squareFeet = Number.isFinite(Number(obj.square_feet)) ? Math.max(0, Number(obj.square_feet)) : undefined;
  const property: AdPropertyDetails = {
    type,
    city: normalizeString(obj.city) || undefined,
    state: normalizeString(obj.state) || undefined,
    country: normalizeString(obj.country) || undefined,
    square_feet: squareFeet,
    price_label: normalizeString(obj.price_label) || undefined,
    call_phone: normalizeString(obj.call_phone) || undefined,
    whatsapp: normalizeString(obj.whatsapp) || undefined,
    map_url: normalizeString(obj.map_url) || undefined,
    description: normalizeString(obj.description) || undefined,
  };
  const hasAny = Object.values(property).some((v) => v !== undefined && v !== null && String(v).trim() !== '');
  return hasAny ? property : undefined;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });
  const { id } = await ctx.params;

  try {
    const body = (await req.json()) as Partial<AdPlacementBanner> & Record<string, unknown>;
    const ads = await loadAds();
    const idx = ads.findIndex((a) => String(a.id) === String(id));
    if (idx < 0) return Response.json({ success: false, message: 'Ad not found' }, { status: 404 });

    const current = ads[idx];
    const next: AdPlacementBanner = { ...current };

    if (body.title !== undefined) next.title = normalizeString(body.title);
    if ((body as any).description !== undefined) next.description = normalizeString((body as any).description) || undefined;
    if ((body as any).href !== undefined) next.href = normalizeString((body as any).href) || undefined;
    if ((body as any).cta_label !== undefined) next.cta_label = normalizeString((body as any).cta_label) || undefined;
    if ((body as any).placement !== undefined) {
      const placement = normalizePlacement((body as any).placement);
      if (!placement) return Response.json({ success: false, message: 'Invalid placement' }, { status: 400 });
      next.placement = placement;
    }
    if ((body as any).is_active !== undefined) next.is_active = Boolean((body as any).is_active);
    if ((body as any).start_time !== undefined) next.start_time = normalizeIsoOrNull((body as any).start_time);
    if ((body as any).end_time !== undefined) next.end_time = normalizeIsoOrNull((body as any).end_time);
    if ((body as any).priority !== undefined) next.priority = Number.isFinite(Number((body as any).priority)) ? Number((body as any).priority) : 0;
    if (Array.isArray((body as any).images)) {
      next.images = (body as any).images.filter((x: any) => typeof x === 'string' && x.trim()).slice(0, 5);
    }
    if ((body as any).property !== undefined) next.property = normalizeProperty((body as any).property);
    next.updated_at = new Date().toISOString();

    if (!next.title) return Response.json({ success: false, message: 'title is required' }, { status: 400 });
    if (!next.images?.length) return Response.json({ success: false, message: 'At least 1 image is required' }, { status: 400 });

    const updated = ads.slice();
    updated[idx] = next;
    await saveAds(updated);
    return Response.json({ success: true, data: next });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Update failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });
  const { id } = await ctx.params;

  try {
    const ads = await loadAds();
    const next = ads.filter((a) => String(a.id) !== String(id));
    if (next.length === ads.length) return Response.json({ success: false, message: 'Ad not found' }, { status: 404 });
    await saveAds(next);
    return Response.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Delete failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}
