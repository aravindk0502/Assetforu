'use client';

import { useEffect, useMemo, useState } from 'react';
import BackNavigation from '@/components/BackNavigation';
import { useAuthStore } from '@/store';
import { Loader2, Send, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

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

  const phones = useMemo(() => parsePhones(phonesRaw), [phonesRaw]);

  const loadLogs = async () => {
    setLoadingLogs(true);
    setError('');
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
      setError(msg);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
        body: JSON.stringify({
          title,
          message,
          link,
          target,
          phones: target === 'phones' ? phones : undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; data?: { success?: number; failure?: number } };
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`);
      setSuccess(`Sent. Success: ${json?.data?.success ?? 0}, Failed: ${json?.data?.failure ?? 0}`);
      setTitle('');
      setMessage('');
      setLink('');
      setPhonesRaw('');
      await loadLogs();
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white">Recent Sends</h2>
            {loadingLogs && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
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
                  </div>
                </div>
                {l.error && <p className="mt-2 text-xs text-red-300">{l.error}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

