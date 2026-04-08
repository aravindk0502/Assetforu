import type { StoreItem } from '@/types';

export async function fetchPublicStoreItems(): Promise<StoreItem[]> {
  try {
    const res = await fetch('/api/public/store-items', { cache: 'no-store' });
    const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: StoreItem[] };
    if (!res.ok || !json?.success || !Array.isArray(json.data)) return [];
    return json.data;
  } catch {
    return [];
  }
}

export async function fetchPublicStoreItem(id: string): Promise<StoreItem | null> {
  try {
    const res = await fetch(`/api/public/store-items/${encodeURIComponent(id)}`, { cache: 'no-store' });
    const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: StoreItem };
    if (!res.ok || !json?.success || !json?.data) return null;
    return json.data;
  } catch {
    return null;
  }
}

