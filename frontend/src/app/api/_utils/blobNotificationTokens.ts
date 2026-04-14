import { put, list } from '@vercel/blob';
import { getBlobReadWriteToken, hasBlobReadWriteToken } from '@/app/api/_utils/blobToken';
import { getCachedBlobData, invalidateCachedBlobData, setCachedBlobData } from '@/app/api/_utils/blobCache';

export type NotificationTokenRecord = {
  phone_last10: string;
  token_sealed: string;
  created_at: string;
  updated_at: string;
};

const TOKENS_KEY = 'notifications/tokens.json';

function nowIso() {
  return new Date().toISOString();
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function loadNotificationTokens(): Promise<NotificationTokenRecord[]> {
  if (!hasBlobReadWriteToken()) return [];
  const cached = getCachedBlobData<NotificationTokenRecord[]>(TOKENS_KEY);
  if (cached) return cached;
  try {
    const res = await list({ prefix: TOKENS_KEY } as any);
    const blobs = safeArray<{ url: string; uploadedAt?: string }>((res as any)?.blobs);
    if (!blobs.length) return [];
    const latest = blobs
      .slice()
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())[0];
    const json = await fetch(latest.url, { cache: 'no-store' }).then((r) => r.json());
    const data = safeArray<NotificationTokenRecord>((json as any)?.data ?? json);
    setCachedBlobData(TOKENS_KEY, data);
    return data;
  } catch {
    return [];
  }
}

export async function saveNotificationTokens(tokens: NotificationTokenRecord[]) {
  const token = getBlobReadWriteToken();
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  const payload = JSON.stringify({ updated_at: nowIso(), data: tokens }, null, 2);
  const saved = await put(TOKENS_KEY, payload, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  } as any);
  invalidateCachedBlobData(TOKENS_KEY);
  return saved;
}
