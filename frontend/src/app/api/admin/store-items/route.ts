export const runtime = 'nodejs';

import crypto from 'node:crypto';
import type { StoreItem } from '@/types';
import { verifyJwtHS256 } from '@/app/api/_utils/jwt';
import { loadStoreItems, saveStoreItems } from '@/app/api/_utils/blobStoreItems';

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

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  try {
    const body = (await req.json()) as Partial<StoreItem> & Record<string, unknown>;
    const title = normalizeString(body.title);
    const image_url = normalizeString(body.image_url);
    const type = normalizeString((body as any).type) as StoreItem['type'];
    const category = normalizeString((body as any).category) || 'Other';
    const description = normalizeString((body as any).description);
    const credit_cost = Number((body as any).credit_cost);
    const is_popular = Boolean((body as any).is_popular);

    if (!title || !image_url || !type || !category) {
      return Response.json({ success: false, message: 'title, image_url, type, and category are required' }, { status: 400 });
    }
    if (!['product', 'service'].includes(type)) {
      return Response.json({ success: false, message: 'type must be either \"product\" or \"service\"' }, { status: 400 });
    }
    if (!Number.isFinite(credit_cost) || credit_cost < 0) {
      return Response.json({ success: false, message: 'credit_cost must be a valid number' }, { status: 400 });
    }

    const items = await loadStoreItems();
    const item: StoreItem = {
      id: crypto.randomUUID(),
      title,
      description,
      image_url,
      type,
      category,
      credit_cost,
      is_popular,
    };
    const next = [item, ...items].slice(0, 1000);
    await saveStoreItems(next);
    return Response.json({ success: true, data: item }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create store item';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });
  const items = await loadStoreItems();
  return Response.json({ success: true, data: items });
}

