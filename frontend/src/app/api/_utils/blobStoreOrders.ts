import { put, list } from '@vercel/blob';
import { getBlobReadWriteToken, hasBlobReadWriteToken } from '@/app/api/_utils/blobToken';
import { getCachedBlobData, invalidateCachedBlobData, setCachedBlobData } from '@/app/api/_utils/blobCache';

export type StoreOrderItem = {
  item_id: string;
  title: string;
  type: 'product' | 'service';
  credits: number;
  quantity: number;
};

export type StoreOrder = {
  id: string; // order id
  phone_last10: string;
  items: StoreOrderItem[];
  total_credits: number;
  delivery_address?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  created_at: string;
  status: 'placed' | 'processing' | 'completed';
};

const KEY = 'orders/store-orders.json';

export async function loadStoreOrders(): Promise<StoreOrder[]> {
  if (!hasBlobReadWriteToken()) return [];
  const cached = getCachedBlobData<StoreOrder[]>(KEY);
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
    const result = Array.isArray(data) ? (data as StoreOrder[]) : [];
    setCachedBlobData(KEY, result);
    return result;
  } catch {
    return [];
  }
}

export async function saveStoreOrders(orders: StoreOrder[]) {
  const token = getBlobReadWriteToken();
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  const payload = JSON.stringify({ updated_at: new Date().toISOString(), data: orders }, null, 2);
  await put(KEY, payload, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  } as any);
  invalidateCachedBlobData(KEY);
}
