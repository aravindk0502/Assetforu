export const runtime = 'nodejs';

import type { SiteContent } from '@/types';
import { verifyJwtHS256 } from '@/app/api/_utils/jwt';
import { loadSiteContent, saveSiteContent } from '@/app/api/_utils/blobSiteContent';

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

function safeObject<T extends object>(value: unknown): T | null {
  if (!value || typeof value !== 'object') return null;
  return value as T;
}

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });
  const content = await loadSiteContent();
  return Response.json({ success: true, data: content });
}

export async function PATCH(req: Request) {
  const auth = requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });
  try {
    const body = (await req.json()) as Partial<SiteContent> & Record<string, unknown>;
    const current = (await loadSiteContent()) || ({} as SiteContent);
    const next: SiteContent = {
      ...current,
      ...safeObject<Partial<SiteContent>>(body),
      updated_at: new Date().toISOString(),
      header: { ...(current.header || {}), ...(safeObject(body.header) || {}) } as any,
      hero: { ...(current.hero || {}), ...(safeObject(body.hero) || {}) } as any,
      footer: { ...(current.footer || {}), ...(safeObject(body.footer) || {}) } as any,
    };
    await saveSiteContent(next);
    return Response.json({ success: true, data: next });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Update failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

