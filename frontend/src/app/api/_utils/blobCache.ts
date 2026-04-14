type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const cache = new Map<string, CacheEntry>();

export function getCachedBlobData<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.value as T;
}

export function setCachedBlobData<T>(key: string, value: T, ttlMs = 8_000) {
  cache.set(key, { value, expiresAt: Date.now() + Math.max(500, ttlMs) });
}

export function invalidateCachedBlobData(key: string) {
  cache.delete(key);
}

