'use client';

import { useEffect, useMemo, useState } from 'react';
import BackNavigation from '@/components/BackNavigation';
import { useAuthStore } from '@/store';
import { Loader2, Send, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { registerFcmToken } from '@/lib/fcm/register';

type LogItem = {
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
};

function parsePhones(value: string): string[] {
  return value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.replace(/\D/g, '').slice(-10))
    .filter((p) => p.length === 10);
}

function readCachedFcmToken() {
  if (typeof window === 'undefined') return '';
  const token = String(localStorage.getItem('af_fcm_token') || '').trim();
  if (token.length < 20 || token.length > 4096) return '';
  return token;
}

export default function AdminNotificationsPage() {
  const token = useAuthStore((s) => s.token);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [target, setTarget] = useState<'all' | 'phones'>('all');
  const [phonesRaw, setPhonesRaw] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<LogItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editLink, setEditLink] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);

  const phones = useMemo(() => parsePhones(phonesRaw), [phonesRaw]);

  const loadLogs = async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (!silent) setLoadingLogs(true);
    if (!silent) setError('');
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) return;
      const res = await fetch('/api/admin/notifications/logs', {
        headers: { authorization: `Bearer ${bearer}` },
        cache: 'no-store',
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: LogItem[]; message?: string };
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`);
      setLogs(Array.isArray(json?.data) ? json.data : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load logs';
      if (!silent) setError(msg);
    } finally {
      if (!silent) setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const timer = window.setInterval(() => {
      loadLogs({ silent: true });
    }, 7000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (item: LogItem) => {
    setEditing(item);
    setEditTitle(item.title || '');
    setEditBody(item.body || '');
    setEditLink(item.link || '');
    setError('');
    setSuccess('');
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    setError('');
    setSuccess('');
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) throw new Error('Not authenticated');
      const res = await fetch('/api/admin/notifications/logs', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
        body: JSON.stringify({
          id: editing.id,
          title: editTitle,
          body: editBody,
          link: editLink,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; data?: LogItem };
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`);
      const updated = json?.data;
      if (updated) setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setEditing(null);
      setSuccess('Notification updated.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update notification';
      setError(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteLog = async (item: LogItem) => {
    const ok = window.confirm('Delete this notification from live list?');
    if (!ok) return;
    setDeletingId(item.id);
    setError('');
    setSuccess('');
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) throw new Error('Not authenticated');
      const res = await fetch('/api/admin/notifications/logs', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
        body: JSON.stringify({ id: item.id }),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`);
      setLogs((prev) => prev.filter((l) => l.id !== item.id));
      setSuccess('Notification deleted.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete notification';
      setError(msg);
    } finally {
      setDeletingId('');
    }
  };

  const deleteAllLogs = async () => {
    const ok = window.confirm('Delete ALL live notifications? This cannot be undone.');
    if (!ok) return;
    setDeletingAll(true);
    setError('');
    setSuccess('');
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) throw new Error('Not authenticated');
      const res = await fetch('/api/admin/notifications/logs', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
        body: JSON.stringify({ all: true }),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`);
      setLogs([]);
      setSuccess('All notifications deleted.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete notifications';
      setError(msg);
    } finally {
      setDeletingAll(false);
    }
  };

  const send = async () => {
    setError('');
    setSuccess('');
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (target === 'phones' && !phones.length) {
      setError('Enter at least one phone number');
      return;
    }

    setSending(true);
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) throw new Error('Not authenticated');

      // Send button click is a user gesture, so this can prompt and register this device reliably.
      const registerResult = await registerFcmToken({ authToken: bearer, promptIfNeeded: true });
      let bootstrapToken = registerResult.token || readCachedFcmToken();
      if (!registerResult.ok) {
        const reason = String(registerResult.reason || '');
        console.log('[FCM] pre-send registration skipped', reason);
        if (reason.startsWith('notification-permission-')) {
          throw new Error('Notifications are blocked in this browser. Please allow notifications for assetforu.com and retry.');
        }
        if (!bootstrapToken) {
          throw new Error(`FCM device registration failed (${reason || 'unknown'}). Please enable notifications and login again.`);
        }
      }

      const sendPayload = {
        title,
        message,
        link,
        target,
        phones: target === 'phones' ? phones : undefined,
        bootstrapToken: bootstrapToken || undefined,
      };

      const res = await fetch('/api/admin/send-push-notification', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
        body: JSON.stringify(sendPayload),
      });
      let json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; data?: { success?: number; failure?: number; log?: LogItem } };

      // If there were zero devices before this click, retry once after pre-send registration.
      if ((!res.ok || json?.success === false) && String(json?.message || '').toLowerCase().includes('no registered devices found')) {
        const retry = await fetch('/api/admin/send-push-notification', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
          body: JSON.stringify(sendPayload),
        });
        json = (await retry.json().catch(() => ({}))) as { success?: boolean; message?: string; data?: { success?: number; failure?: number; log?: LogItem } };
        if (!retry.ok || json?.success === false) throw new Error(json?.message || `HTTP ${retry.status}`);
      } else if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }

      setSuccess(`Sent. Success: ${json?.data?.success ?? 0}, Failed: ${json?.data?.failure ?? 0}`);
      if (json?.data?.log) {
        setLogs((prev) => [json.data!.log as LogItem, ...prev.filter((x) => x.id !== json.data!.log!.id)]);
      }
      setTitle('');
      setMessage('');
      setLink('');
      setPhonesRaw('');
      setTimeout(() => {
        loadLogs({ silent: true });
      }, 600);
      setTimeout(() => setSuccess(''), 3500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <BackNavigation />
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-white">Notifications</h1>
          <p className="text-slate-400 mt-1">Send push notifications to users who allowed notifications.</p>
        </div>
        <button
          type="button"
          onClick={loadLogs}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-extrabold text-white">Compose</h2>
          <p className="text-sm text-slate-400 mt-1">Title is required. Link is optional.</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Target</label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setTarget('all')}
                  className={clsx(
                    'flex-1 rounded-xl px-4 py-2 text-sm font-bold border',
                    target === 'all' ? 'bg-primary-700 border-primary-700 text-white' : 'border-slate-700 text-slate-200 hover:bg-slate-800'
                  )}
                >
                  All Devices
                </button>
                <button
                  type="button"
                  onClick={() => setTarget('phones')}
                  className={clsx(
                    'flex-1 rounded-xl px-4 py-2 text-sm font-bold border',
                    target === 'phones' ? 'bg-primary-700 border-primary-700 text-white' : 'border-slate-700 text-slate-200 hover:bg-slate-800'
                  )}
                >
                  By Phone
                </button>
              </div>
            </div>

            {target === 'phones' && (
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Phone Numbers</label>
                <input
                  value={phonesRaw}
                  onChange={(e) => setPhonesRaw(e.target.value)}
                  placeholder="Comma separated (e.g. 9344562418,9876543210)"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
                <p className="mt-1 text-xs text-slate-500">Uses last 10 digits; numbers must be registered on a device.</p>
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New update"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Short message…"
                className="mt-2 w-full h-28 resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Link (optional)</label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://www.assetforu.com/campaigns/..."
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}
            {success && <p className="text-sm text-emerald-300">{success}</p>}

            <button
              type="button"
              onClick={send}
              disabled={sending}
              className={clsx(
                'w-full rounded-xl px-5 py-3 text-sm font-extrabold text-white flex items-center justify-center gap-2',
                sending ? 'bg-primary-900' : 'bg-primary-700 hover:bg-primary-600'
              )}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Notification
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold text-white">Recent Sends</h2>
            <div className="flex items-center gap-2">
              {loadingLogs && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
              <button
                type="button"
                onClick={deleteAllLogs}
                disabled={deletingAll || logs.length === 0}
                className="rounded-lg border border-red-700 px-2.5 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-950 disabled:opacity-60"
              >
                {deletingAll ? 'Deleting…' : 'Delete All'}
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-3 max-h-[520px] overflow-auto pr-2">
            {!loadingLogs && logs.length === 0 && (
              <p className="text-sm text-slate-400">No notifications sent yet.</p>
            )}
            {logs.map((l) => (
              <div key={l.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-white">{l.title}</p>
                    {l.body && <p className="text-xs text-slate-300 mt-1">{l.body}</p>}
                    <p className="text-[11px] text-slate-500 mt-2">
                      {new Date(l.created_at).toLocaleString()} • Target: {l.target}
                      {l.target === 'phones' && l.target_phones_last10?.length
                        ? ` (${l.target_phones_last10.length})`
                        : ''}
                    </p>
                    {l.link && (
                      <p className="text-[11px] text-slate-400 mt-1 break-all">
                        Link: <span className="text-slate-300">{l.link}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-300 font-bold">✓ {l.success_count}</p>
                    <p className={clsx('text-xs font-bold', l.failure_count ? 'text-red-300' : 'text-slate-500')}>
                      ✕ {l.failure_count}
                    </p>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(l)}
                        className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLog(l)}
                        disabled={deletingId === l.id}
                        className="rounded-lg border border-red-700 px-2 py-1 text-[11px] font-bold text-red-300 hover:bg-red-950 disabled:opacity-60"
                      >
                        {deletingId === l.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
                {l.error && <p className="mt-2 text-xs text-red-300">{l.error}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-lg font-extrabold text-white">Edit Notification</h3>
            <p className="text-xs text-slate-400 mt-1">Update title, message or link in live notification list.</p>

            <div className="mt-4 space-y-3">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                placeholder="Message"
                className="w-full h-24 resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
              <input
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
                placeholder="/campaigns/123 or https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-700"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit}
                className="rounded-xl bg-primary-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-primary-600 disabled:opacity-70"
              >
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
