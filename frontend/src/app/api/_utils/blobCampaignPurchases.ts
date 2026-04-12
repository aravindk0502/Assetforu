import { put, list } from '@vercel/blob';
import { getBlobReadWriteToken, hasBlobReadWriteToken } from '@/app/api/_utils/blobToken';

export type CampaignPurchase = {
  id: string;
  phone_last10: string;
  campaign_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};

const PURCHASES_KEY = 'participations/campaign-purchases.json';

function nowIso() {
  return new Date().toISOString();
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function loadCampaignPurchases(): Promise<CampaignPurchase[]> {
  if (!hasBlobReadWriteToken()) return [];
  try {
    const res = await list({ prefix: PURCHASES_KEY } as any);
    const blobs = safeArray<{ url: string; uploadedAt?: string }>((res as any)?.blobs);
    if (!blobs.length) return [];
    const latest = blobs
      .slice()
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())[0];
    const json = await fetch(latest.url, { cache: 'no-store' }).then((r) => r.json());
    return safeArray<CampaignPurchase>((json as any)?.data ?? json);
  } catch {
    return [];
  }
}

export async function saveCampaignPurchases(purchases: CampaignPurchase[]) {
  const token = getBlobReadWriteToken();
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  const payload = JSON.stringify({ updated_at: nowIso(), data: purchases }, null, 2);
  return put(PURCHASES_KEY, payload, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  } as any);
}

