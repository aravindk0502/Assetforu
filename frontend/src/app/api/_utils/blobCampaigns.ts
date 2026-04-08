import { put, list } from '@vercel/blob';
import type { Campaign } from '@/types';

const CAMPAIGNS_KEY = 'campaigns/campaigns.json';

function nowIso() {
  return new Date().toISOString();
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function loadCampaigns(): Promise<Campaign[]> {
  // If Blob isn't configured, treat as "no campaigns" and let callers fallback.
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const res = await list({ prefix: CAMPAIGNS_KEY } as any);
    const blobs = safeArray<{ url: string; uploadedAt?: string }>((res as any)?.blobs);
    if (!blobs.length) return [];
    const latest = blobs
      .slice()
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())[0];
    const json = await fetch(latest.url, { cache: 'no-store' }).then((r) => r.json());
    return safeArray<Campaign>((json as any)?.data ?? json);
  } catch {
    return [];
  }
}

export async function saveCampaigns(campaigns: Campaign[]) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }
  const putOptions: any = {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  };
  const payload = JSON.stringify({ updated_at: nowIso(), data: campaigns }, null, 2);
  return put(CAMPAIGNS_KEY, payload, putOptions);
}
