export const runtime = 'nodejs';

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
  return { ok: true as const };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });

  const { id } = await ctx.params;
  const updates = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const campaigns = await loadCampaigns();
  const idx = campaigns.findIndex((c) => String(c.id) === String(id));
  if (idx < 0) return Response.json({ success: false, message: 'Campaign not found' }, { status: 404 });

  const allowed = new Set(['title', 'description', 'location', 'image_url', 'image_urls', 'credit_price', 'total_slots', 'status', 'end_time', 'badge', 'is_featured']);
  const next = campaigns.slice();
  const current = next[idx];
  next[idx] = Object.fromEntries(
    Object.entries({ ...current, ...updates }).filter(([k]) => k in current || allowed.has(k))
  ) as any;

  await saveCampaigns(next);
  return Response.json({ success: true, data: next[idx] });
}

