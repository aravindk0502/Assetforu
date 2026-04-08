export const runtime = 'nodejs';

import crypto from 'node:crypto';
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
  return String(input ?? '').trim();
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
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
    const end_time = normalizeString((body as any).end_time) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const badge = normalizeString((body as any).badge) || undefined;
    const is_featured = Boolean((body as any).is_featured);
    const image_urls = Array.isArray((body as any).image_urls) ? (body as any).image_urls.slice(0, 5) : undefined;

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
      status: 'active',
      end_time,
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
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const campaigns = await loadCampaigns();
  const filtered = status ? campaigns.filter((c) => c.status === status) : campaigns;
  return Response.json({ success: true, data: filtered });
}

