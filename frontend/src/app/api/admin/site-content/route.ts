export const runtime = 'nodejs';

import type { SiteContent } from '@/types';
import { loadSiteContent, saveSiteContent } from '@/app/api/_utils/blobSiteContent';
import { requireAdmin } from '@/app/api/_utils/adminAuth';

function safeObject<T extends object>(value: unknown): T | null {
  if (!value || typeof value !== 'object') return null;
  return value as T;
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return Response.json({ success: false, message: auth.message }, { status: auth.status });
  const content = await loadSiteContent();
  return Response.json({ success: true, data: content });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
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
