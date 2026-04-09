export const runtime = 'nodejs';

import type { Campaign } from '@/types';
import { verifyJwtHS256 } from '@/app/api/_utils/jwt';
import { loadCampaigns, saveCampaigns } from '@/app/api/_utils/blobCampaigns';

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
  return { ok: true as const, payload };
}

function normalizeString(input: unknown) {
  const v = input == null ? '' : String(input);
  const t = v.trim();
  if (!t) return '';
  if (t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined') return '';
  return t;
}

function normalizeStatus(raw: unknown) {
  const s = normalizeString(raw).toLowerCase();
  if (!s) return undefined;
  if (s === 'close') return 'closed';
  if (s === 'closed' || s === 'active' || s === 'upcoming') return s;
  return undefined;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as Partial<Campaign> & Record<string, unknown>;
    const campaigns = await loadCampaigns();
    const idx = campaigns.findIndex((c) => String(c.id) === String(id));
    if (idx < 0) return Response.json({ success: false, message: 'Campaign not found' }, { status: 404 });

    const current = campaigns[idx];
    const next: Campaign = { ...current };

    const title = normalizeString(body.title);
    if (body.title !== undefined) next.title = title;
    const description = normalizeString(body.description);
    if (body.description !== undefined) next.description = description;
    const location = normalizeString(body.location);
    if (body.location !== undefined) next.location = location;
    const image_url = normalizeString((body as any).image_url);
    if ((body as any).image_url !== undefined) next.image_url = image_url;
    const badge = normalizeString((body as any).badge);
    if ((body as any).badge !== undefined) next.badge = badge || undefined;
    if ((body as any).is_featured !== undefined) next.is_featured = Boolean((body as any).is_featured);

    if ((body as any).credit_price !== undefined) {
      const credit_price = Number((body as any).credit_price);
      if (!Number.isFinite(credit_price) || credit_price < 0) {
        return Response.json({ success: false, message: 'credit_price must be a valid number' }, { status: 400 });
      }
      next.credit_price = credit_price;
    }

    if ((body as any).total_slots !== undefined) {
      const total_slots = Math.max(1, Number((body as any).total_slots) || 100);
      next.total_slots = total_slots;
    }

    if ((body as any).end_time !== undefined) {
      const end_time = normalizeString((body as any).end_time);
      next.end_time = end_time || null;
    }

    if ((body as any).status !== undefined) {
      const status = normalizeStatus((body as any).status);
      if (!status) return Response.json({ success: false, message: 'Invalid status' }, { status: 400 });
      next.status = status as any;
    }

    if (Array.isArray((body as any).image_urls)) {
      next.image_urls = (body as any).image_urls.slice(0, 5);
    }

    // Basic validation for required fields if touched
    if (!normalizeString(next.title) || !normalizeString(next.description) || !normalizeString(next.image_url)) {
      return Response.json({ success: false, message: 'title, description, and image_url are required' }, { status: 400 });
    }

    const updated = campaigns.slice();
    updated[idx] = next;
    await saveCampaigns(updated);
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
    const campaigns = await loadCampaigns();
    const next = campaigns.filter((c) => String(c.id) !== String(id));
    if (next.length === campaigns.length) {
      return Response.json({ success: false, message: 'Campaign not found' }, { status: 404 });
    }
    await saveCampaigns(next);
    return Response.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Delete failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

