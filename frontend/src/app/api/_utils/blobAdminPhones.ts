import { put, list } from '@vercel/blob';
import { getBlobReadWriteToken, hasBlobReadWriteToken } from '@/app/api/_utils/blobToken';

const ADMIN_PHONES_KEY = 'admin/admin-phones.json';

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeLast10(raw: string) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 10) return digits.padStart(10, '0').slice(-10);
  return digits.slice(-10);
}

export function parsePhonesToLast10(raw: string | undefined): Set<string> {
  const set = new Set<string>();
  if (!raw) return set;
  for (const part of raw.split(',')) {
    const last10 = normalizeLast10(part.trim());
    if (last10) set.add(last10);
  }
  return set;
}

export async function loadDynamicAdminPhones(): Promise<string[]> {
  // If Blob isn't configured, treat as "no dynamic admins".
  if (!hasBlobReadWriteToken()) return [];
  try {
    const res = await list({ prefix: ADMIN_PHONES_KEY } as any);
    const blobs = safeArray<{ url: string; uploadedAt?: string }>((res as any)?.blobs);
    if (!blobs.length) return [];
    const latest = blobs
      .slice()
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())[0];
    const json = await fetch(latest.url, { cache: 'no-store' }).then((r) => r.json());
    const data = safeArray<string>((json as any)?.data ?? json);
    const normalized = Array.from(new Set(data.map((p) => normalizeLast10(p)).filter(Boolean)));
    return normalized.sort();
  } catch {
    return [];
  }
}

export async function saveDynamicAdminPhones(phones: string[]) {
  const token = getBlobReadWriteToken();
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  const normalized = Array.from(new Set(phones.map((p) => normalizeLast10(p)).filter(Boolean))).sort();
  const payload = JSON.stringify({ updated_at: nowIso(), data: normalized }, null, 2);
  return put(
    ADMIN_PHONES_KEY,
    payload,
    { access: 'public', contentType: 'application/json', addRandomSuffix: false, token } as any
  );
}

