import { put, list } from '@vercel/blob';
import { getBlobReadWriteToken, hasBlobReadWriteToken } from '@/app/api/_utils/blobToken';
import type { Transaction } from '@/types';

export type BlobTransaction = Transaction & { phone_last10?: string };

const TXN_KEY = 'transactions/transactions.json';

function nowIso() {
  return new Date().toISOString();
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function loadTransactions(): Promise<BlobTransaction[]> {
  if (!hasBlobReadWriteToken()) return [];
  try {
    const res = await list({ prefix: TXN_KEY } as any);
    const blobs = safeArray<{ url: string; uploadedAt?: string }>((res as any)?.blobs);
    if (!blobs.length) return [];
    const latest = blobs
      .slice()
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())[0];
    const json = await fetch(latest.url, { cache: 'no-store' }).then((r) => r.json());
    return safeArray<BlobTransaction>((json as any)?.data ?? json);
  } catch {
    return [];
  }
}

export async function saveTransactions(txns: BlobTransaction[]) {
  const token = getBlobReadWriteToken();
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  const payload = JSON.stringify({ updated_at: nowIso(), data: txns }, null, 2);
  return put(TXN_KEY, payload, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  } as any);
}

