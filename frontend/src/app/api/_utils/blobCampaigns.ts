import { put, list } from '@vercel/blob';
import type { Campaign } from '@/types';
import { getBlobReadWriteToken, hasBlobReadWriteToken } from '@/app/api/_utils/blobToken';
import { getCachedBlobData, invalidateCachedBlobData, setCachedBlobData } from '@/app/api/_utils/blobCache';

const CAMPAIGNS_KEY = 'campaigns/campaigns.json';

function nowIso() {
  return new Date().toISOString();
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function loadCampaigns(): Promise<Campaign[]> {
  // If Blob isn't configured, treat as "no campaigns" and let callers fallback.
  if (!hasBlobReadWriteToken()) return [];
  const cached = getCachedBlobData<Campaign[]>(CAMPAIGNS_KEY);
  if (cached) return cached;
  try {
    const res = await list({ prefix: CAMPAIGNS_KEY } as any);
    const blobs = safeArray<{ url: string; uploadedAt?: string }>((res as any)?.blobs);
    if (!blobs.length) return [];
    const latest = blobs
      .slice()
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())[0];
    const json = await fetch(latest.url, { cache: 'no-store' }).then((r) => r.json());
    const data = safeArray<Campaign>((json as any)?.data ?? json);
    setCachedBlobData(CAMPAIGNS_KEY, data);
    return data;
  } catch {
    return [];
  }
}

export async function saveCampaigns(campaigns: Campaign[]) {
  const token = getBlobReadWriteToken();
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }
  const putOptions: any = {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  };
  const payload = JSON.stringify({ updated_at: nowIso(), data: campaigns }, null, 2);
  const saved = await put(CAMPAIGNS_KEY, payload, putOptions);
  invalidateCachedBlobData(CAMPAIGNS_KEY);
  return saved;
}
