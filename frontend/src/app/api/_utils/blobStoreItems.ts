import { put, list } from '@vercel/blob';
import type { StoreItem } from '@/types';
import { getBlobReadWriteToken, hasBlobReadWriteToken } from '@/app/api/_utils/blobToken';
import { getCachedBlobData, invalidateCachedBlobData, setCachedBlobData } from '@/app/api/_utils/blobCache';

const STORE_ITEMS_KEY = 'store/store-items.json';

function nowIso() {
  return new Date().toISOString();
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function loadStoreItems(): Promise<StoreItem[]> {
  if (!hasBlobReadWriteToken()) return [];
  const cached = getCachedBlobData<StoreItem[]>(STORE_ITEMS_KEY);
  if (cached) return cached;
  try {
    const res = await list({ prefix: STORE_ITEMS_KEY } as any);
    const blobs = safeArray<{ url: string; uploadedAt?: string }>((res as any)?.blobs);
    if (!blobs.length) return [];
    const latest = blobs
      .slice()
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())[0];
    const json = await fetch(latest.url, { cache: 'no-store' }).then((r) => r.json());
    const data = safeArray<StoreItem>((json as any)?.data ?? json);
    setCachedBlobData(STORE_ITEMS_KEY, data);
    return data;
  } catch {
    return [];
  }
}

export async function saveStoreItems(items: StoreItem[]) {
  const token = getBlobReadWriteToken();
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }
  const payload = JSON.stringify({ updated_at: nowIso(), data: items }, null, 2);
  const saved = await put(STORE_ITEMS_KEY, payload, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  } as any);
  invalidateCachedBlobData(STORE_ITEMS_KEY);
  return saved;
}
