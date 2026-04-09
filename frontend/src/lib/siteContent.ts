import type { SiteContent } from '@/types';

let cached: { at: number; value: SiteContent | null } | null = null;
let inflight: Promise<SiteContent | null> | null = null;

export async function fetchSiteContent(): Promise<SiteContent | null> {
  const now = Date.now();
  if (cached && now - cached.at < 30_000) return cached.value;
  if (inflight) return inflight;
  inflight = fetch('/api/public/site-content', { cache: 'no-store' })
    .then((r) => r.json())
    .then((json: any) => {
      const value = (json && json.success) ? (json.data as SiteContent | null) : null;
      cached = { at: Date.now(), value: value || null };
      return cached.value;
    })
    .catch(() => {
      cached = { at: Date.now(), value: null };
      return null;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

