export const runtime = 'nodejs';

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

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const { id } = await ctx.params;
  const updates = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const items = await loadStoreItems();
  const idx = items.findIndex((i) => String(i.id) === String(id));
  if (idx < 0) return Response.json({ success: false, message: 'Item not found' }, { status: 404 });

  const allowed = new Set(['title', 'description', 'image_url', 'type', 'category', 'credit_cost', 'is_popular']);
  const merged: Record<string, unknown> = { ...items[idx], ...updates };

  // Normalize fields
  if (merged.type && typeof merged.type === 'string') merged.type = merged.type.toLowerCase();
  if (merged.credit_cost != null) merged.credit_cost = Number(merged.credit_cost);

  const next = items.slice();
  next[idx] = Object.fromEntries(Object.entries(merged).filter(([k]) => k in items[idx] || allowed.has(k))) as any;
  await saveStoreItems(next);
  return Response.json({ success: true, data: next[idx] });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const { id } = await ctx.params;
  const items = await loadStoreItems();
  const next = items.filter((i) => String(i.id) !== String(id));
  await saveStoreItems(next);
  return Response.json({ success: true });
}

