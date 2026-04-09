import { put, list } from '@vercel/blob';
import type { AdPlacementBanner } from '@/types';
import { getBlobReadWriteToken, hasBlobReadWriteToken } from '@/app/api/_utils/blobToken';

const ADS_KEY = 'ads/ads.json';

function nowIso() {
  return new Date().toISOString();
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function loadAds(): Promise<AdPlacementBanner[]> {
  if (!hasBlobReadWriteToken()) return [];
  try {
    const res = await list({ prefix: ADS_KEY } as any);
    const blobs = safeArray<{ url: string; uploadedAt?: string }>((res as any)?.blobs);
    if (!blobs.length) return [];
    const latest = blobs
      .slice()
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())[0];
    const json = await fetch(latest.url, { cache: 'no-store' }).then((r) => r.json());
    return safeArray<AdPlacementBanner>((json as any)?.data ?? json);
  } catch {
    return [];
  }
}

export async function saveAds(ads: AdPlacementBanner[]) {
  const token = getBlobReadWriteToken();
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  const payload = JSON.stringify({ updated_at: nowIso(), data: ads }, null, 2);
  return put(ADS_KEY, payload, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  } as any);
}

