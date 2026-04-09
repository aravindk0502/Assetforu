import { put, list } from '@vercel/blob';
import type { SiteContent } from '@/types';
import { getBlobReadWriteToken, hasBlobReadWriteToken } from '@/app/api/_utils/blobToken';

const SITE_KEY = 'site/site.json';

function safeObject<T extends object>(value: unknown): T | null {
  if (!value || typeof value !== 'object') return null;
  return value as T;
}

export async function loadSiteContent(): Promise<SiteContent | null> {
  if (!hasBlobReadWriteToken()) return null;
  try {
    const res = await list({ prefix: SITE_KEY } as any);
    const blobs = Array.isArray((res as any)?.blobs) ? ((res as any).blobs as any[]) : [];
    if (!blobs.length) return null;
    const latest = blobs
      .slice()
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())[0];
    const json = await fetch(String(latest.url), { cache: 'no-store' }).then((r) => r.json());
    const record = safeObject<SiteContent>((json as any)?.data ?? json);
    return record;
  } catch {
    return null;
  }
}

export async function saveSiteContent(content: SiteContent) {
  const token = getBlobReadWriteToken();
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  const payload = JSON.stringify({ updated_at: new Date().toISOString(), data: content }, null, 2);
  return put(SITE_KEY, payload, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  } as any);
}

