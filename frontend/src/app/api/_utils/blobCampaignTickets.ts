import { put, list } from '@vercel/blob';
import { getBlobReadWriteToken, hasBlobReadWriteToken } from '@/app/api/_utils/blobToken';
import { getCachedBlobData, invalidateCachedBlobData, setCachedBlobData } from '@/app/api/_utils/blobCache';

export type CampaignTicket = {
  id: string;
  phone_last10: string;
  campaign_id: string;
  campaign_title?: string;
  ticket_number: number;
  created_at: string;
};

const KEY = 'participations/campaign-tickets.json';

export async function loadCampaignTickets(): Promise<CampaignTicket[]> {
  if (!hasBlobReadWriteToken()) return [];
  const cached = getCachedBlobData<CampaignTicket[]>(KEY);
  if (cached) return cached;
  try {
    const res = await list({ prefix: KEY } as any);
    const blobs = Array.isArray((res as any)?.blobs) ? (res as any).blobs as Array<{ url: string; uploadedAt?: string }> : [];
    if (!blobs.length) return [];
    const latest = blobs
      .slice()
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())[0];
    const json = await fetch(latest.url, { cache: 'no-store' }).then((r) => r.json());
    const data = (json as any)?.data ?? json;
    const result = Array.isArray(data) ? (data as CampaignTicket[]) : [];
    setCachedBlobData(KEY, result);
    return result;
  } catch {
    return [];
  }
}

export async function saveCampaignTickets(tickets: CampaignTicket[]) {
  const token = getBlobReadWriteToken();
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  const payload = JSON.stringify({ updated_at: new Date().toISOString(), data: tickets }, null, 2);
  await put(KEY, payload, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  } as any);
  invalidateCachedBlobData(KEY);
}
