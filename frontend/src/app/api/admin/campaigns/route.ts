export const runtime = 'nodejs';

import crypto from 'node:crypto';
import type { Campaign } from '@/types';
import { loadCampaigns, saveCampaigns } from '@/app/api/_utils/blobCampaigns';
import { requireAdmin } from '@/app/api/_utils/adminAuth';

function normalizeString(input: unknown) {
  const v = input == null ? '' : String(input);
  const t = v.trim();
  if (!t) return '';
  if (t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined') return '';
  return t;
}

function normalizeStatus(raw: unknown) {
  const s = normalizeString(raw).toLowerCase();
  if (!s) return 'active';
  if (s === 'close') return 'closed';
  if (s === 'closed' || s === 'active' || s === 'upcoming') return s;
  return 'active';
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  try {
    const body = (await req.json()) as Partial<Campaign> & Record<string, unknown>;
    const title = normalizeString(body.title);
    const description = normalizeString(body.description);
    const location = normalizeString(body.location);
    const image_url = normalizeString(body.image_url);
    const credit_price = Number((body as any).credit_price);

    if (!title || !description || !image_url) {
      return Response.json({ success: false, message: 'title, description, and image_url are required' }, { status: 400 });
    }
    if (!Number.isFinite(credit_price) || credit_price < 0) {
      return Response.json({ success: false, message: 'credit_price must be a valid number' }, { status: 400 });
    }

    const total_slots = Math.max(1, Number((body as any).total_slots) || 100);
    const end_time =
      normalizeString((body as any).end_time) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const badge = normalizeString((body as any).badge) || undefined;
    const is_featured = Boolean((body as any).is_featured);
    const image_urls = Array.isArray((body as any).image_urls) ? (body as any).image_urls.slice(0, 5) : undefined;
    const status = normalizeStatus((body as any).status);
    const max_qty_raw = (body as any).max_qty;
    const max_qty =
      max_qty_raw === undefined || max_qty_raw === null || String(max_qty_raw).trim() === ''
        ? undefined
        : Math.max(1, Math.min(50, Number(max_qty_raw) || 1));
    const sold_out_announcement_raw = normalizeString((body as any).sold_out_announcement);
    const sold_out_announcement = sold_out_announcement_raw ? sold_out_announcement_raw : undefined;

    const campaigns = await loadCampaigns();
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    const campaign: Campaign = {
      id,
      title,
      description,
      location,
      image_url,
      image_urls,
      credit_price,
      total_slots,
      filled_slots: 0,
      status: status as any,
      end_time,
      max_qty,
      sold_out_announcement,
      badge,
      is_featured,
      created_at,
    };

    const next = [campaign, ...campaigns].slice(0, 500);
    await saveCampaigns(next);

    return Response.json({ success: true, data: campaign }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create campaign';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const campaigns = await loadCampaigns();
  const filtered = status ? campaigns.filter((c) => c.status === status) : campaigns;
  return Response.json({ success: true, data: filtered });
}
