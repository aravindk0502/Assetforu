import { put, list } from '@vercel/blob';
import { getBlobReadWriteToken, hasBlobReadWriteToken } from '@/app/api/_utils/blobToken';

export type NotificationSendLog = {
  id: string;
  created_at: string;
  title: string;
  body?: string;
  link?: string;
  target: 'all' | 'phones';
  target_phones_last10?: string[];
  success_count: number;
  failure_count: number;
  error?: string;
  actor_phone_last10?: string;
};

const LOGS_KEY = 'notifications/logs.json';

function nowIso() {
  return new Date().toISOString();
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function loadNotificationLogs(): Promise<NotificationSendLog[]> {
  if (!hasBlobReadWriteToken()) return [];
  try {
    const res = await list({ prefix: LOGS_KEY } as any);
    const blobs = safeArray<{ url: string; uploadedAt?: string }>((res as any)?.blobs);
    if (!blobs.length) return [];
    const latest = blobs
      .slice()
      .sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime())[0];
    const json = await fetch(latest.url, { cache: 'no-store' }).then((r) => r.json());
    return safeArray<NotificationSendLog>((json as any)?.data ?? json);
  } catch {
    return [];
  }
}

export async function saveNotificationLogs(logs: NotificationSendLog[]) {
  const token = getBlobReadWriteToken();
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  const payload = JSON.stringify({ updated_at: nowIso(), data: logs }, null, 2);
  return put(LOGS_KEY, payload, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  } as any);
}

