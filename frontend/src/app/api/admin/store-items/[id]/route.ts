export const runtime = 'nodejs';

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

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as Partial<StoreItem> & Record<string, unknown>;
    const items = await loadStoreItems();
    const idx = items.findIndex((i) => String(i.id) === String(id));
    if (idx < 0) return Response.json({ success: false, message: 'Store item not found' }, { status: 404 });

    const current = items[idx];
    const next: StoreItem = { ...current };

    if (body.title !== undefined) next.title = normalizeString(body.title);
    if ((body as any).description !== undefined) next.description = normalizeString((body as any).description);
    if ((body as any).image_url !== undefined) next.image_url = normalizeString((body as any).image_url);
    if ((body as any).type !== undefined) next.type = normalizeString((body as any).type) as any;
    if ((body as any).category !== undefined) next.category = normalizeString((body as any).category) || 'Other';
    if ((body as any).credit_cost !== undefined) {
      const credit_cost = Number((body as any).credit_cost);
      if (!Number.isFinite(credit_cost) || credit_cost < 0) {
        return Response.json({ success: false, message: 'credit_cost must be a valid number' }, { status: 400 });
      }
      next.credit_cost = credit_cost;
    }
    if ((body as any).is_popular !== undefined) next.is_popular = Boolean((body as any).is_popular);

    if (!next.title || !next.image_url || !next.type || !next.category) {
      return Response.json({ success: false, message: 'title, image_url, type, and category are required' }, { status: 400 });
    }
    if (!['product', 'service'].includes(next.type)) {
      return Response.json({ success: false, message: 'type must be either \"product\" or \"service\"' }, { status: 400 });
    }

    const updated = items.slice();
    updated[idx] = next;
    await saveStoreItems(updated);
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
    const items = await loadStoreItems();
    const next = items.filter((i) => String(i.id) !== String(id));
    if (next.length === items.length) {
      return Response.json({ success: false, message: 'Store item not found' }, { status: 404 });
    }
    await saveStoreItems(next);
    return Response.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Delete failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

