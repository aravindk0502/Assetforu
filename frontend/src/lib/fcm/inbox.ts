export type ClientNotificationItem = {
  id: string;
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  sourceId?: string;
};

const STORAGE_KEY = 'af_notifications';
const EVENT_NAME = 'af:fcm-notifications-updated';
const MAX_ITEMS = 50;

function safeParse(raw: string | null): ClientNotificationItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({
        id: String(x?.id || '').trim(),
        title: String(x?.title || '').trim(),
        message: String(x?.message || '').trim(),
        link: String(x?.link || '').trim() || undefined,
        createdAt: String(x?.createdAt || '').trim() || new Date().toISOString(),
        sourceId: String(x?.sourceId || '').trim() || undefined,
      }))
      .filter((x) => x.id && x.title);
  } catch {
    return [];
  }
}

function emitUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function getNotificationsUpdatedEventName() {
  return EVENT_NAME;
}

export function readClientNotifications(): ClientNotificationItem[] {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function pushClientNotification(input: {
  title: string;
  message?: string;
  link?: string;
  createdAt?: string;
  sourceId?: string;
}) {
  if (typeof window === 'undefined') return;
  const title = String(input.title || '').trim();
  if (!title) return;
  const item: ClientNotificationItem = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    message: String(input.message || '').trim(),
    link: String(input.link || '').trim() || undefined,
    createdAt: input.createdAt || new Date().toISOString(),
    sourceId: String(input.sourceId || '').trim() || undefined,
  };
  const existing = readClientNotifications();
  const next = [item, ...existing].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emitUpdated();
}

export function upsertClientNotifications(
  items: Array<{
    sourceId: string;
    title: string;
    message?: string;
    link?: string;
    createdAt?: string;
  }>
) {
  if (typeof window === 'undefined') return;
  if (!Array.isArray(items) || !items.length) return;

  const existing = readClientNotifications();
  const bySource = new Set(existing.map((x) => x.sourceId).filter(Boolean));
  const additions: ClientNotificationItem[] = [];

  for (const raw of items) {
    const sourceId = String(raw?.sourceId || '').trim();
    const title = String(raw?.title || '').trim();
    if (!sourceId || !title || bySource.has(sourceId)) continue;
    bySource.add(sourceId);
    additions.push({
      id: `srv-${sourceId}`,
      sourceId,
      title,
      message: String(raw?.message || '').trim(),
      link: String(raw?.link || '').trim() || undefined,
      createdAt: String(raw?.createdAt || '').trim() || new Date().toISOString(),
    });
  }

  if (!additions.length) return;
  const next = [...additions, ...existing]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emitUpdated();
}
