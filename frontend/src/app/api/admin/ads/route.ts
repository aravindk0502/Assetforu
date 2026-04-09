export const runtime = 'nodejs';

import crypto from 'node:crypto';
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

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });
  const ads = await loadAds();
  return Response.json({ success: true, data: ads });
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  try {
    const body = (await req.json()) as Partial<AdPlacementBanner> & Record<string, unknown>;
    const title = normalizeString(body.title);
    const placement = normalizePlacement((body as any).placement);
    const images = Array.isArray((body as any).images) ? (body as any).images.filter((x: any) => typeof x === 'string' && x.trim()).slice(0, 5) : [];

    if (!title) return Response.json({ success: false, message: 'title is required' }, { status: 400 });
    if (!placement) return Response.json({ success: false, message: 'placement is required' }, { status: 400 });
    if (!images.length) return Response.json({ success: false, message: 'At least 1 image is required' }, { status: 400 });

    const ad: AdPlacementBanner = {
      id: crypto.randomUUID(),
      title,
      description: normalizeString((body as any).description) || undefined,
      images,
      href: normalizeString((body as any).href) || undefined,
      cta_label: normalizeString((body as any).cta_label) || undefined,
      placement,
      property: normalizeProperty((body as any).property),
      is_active: (body as any).is_active === undefined ? true : Boolean((body as any).is_active),
      start_time: normalizeIsoOrNull((body as any).start_time),
      end_time: normalizeIsoOrNull((body as any).end_time),
      priority: Number.isFinite(Number((body as any).priority)) ? Number((body as any).priority) : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const ads = await loadAds();
    const next = [ad, ...ads].slice(0, 2000);
    await saveAds(next);
    return Response.json({ success: true, data: ad }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create ad';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}
