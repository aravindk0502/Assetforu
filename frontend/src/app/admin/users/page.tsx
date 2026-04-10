'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { User, ShieldCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import BackNavigation from '@/components/BackNavigation';
import AdminJsonModal from '@/components/admin/AdminJsonModal';
import { useAuthStore } from '@/store';

interface AdminUser {
  id: string; phone: string; name?: string; email?: string;
  kyc_status: string; role: string; balance: number; created_at: string;
}

function last10(raw: string) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length <= 10 ? digits.padStart(10, '0').slice(-10) : digits.slice(-10);
}

export default function AdminUsersPage() {
  const token = useAuthStore((s) => s.token);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [adminPhones, setAdminPhones] = useState<{ all: string[]; env: string[]; dynamic: string[] } | null>(null);
  const [adminBusy, setAdminBusy] = useState<string | null>(null);
  const [adminError, setAdminError] = useState('');
  const [addPhone, setAddPhone] = useState('');

  useEffect(() => {
    setLoading(true);
    adminAPI.getUsers(page).then(r => { setUsers(r.data.data); setTotal(r.data.meta.total); }).catch(() => { }).finally(() => setLoading(false));
  }, [page]);

  const loadAdminPhones = async () => {
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) return;
      const res = await fetch('/api/admin/admin-phones', { headers: { authorization: `Bearer ${bearer}` }, cache: 'no-store' });
      const json = (await res.json().catch(() => ({}))) as any;
      if (res.ok && json?.success && json?.data) setAdminPhones(json.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadAdminPhones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggleAdmin = async (phone10: string, makeAdmin: boolean) => {
    setAdminError('');
    try {
      const bearer = token || (typeof window !== 'undefined' ? localStorage.getItem('af_token') : null);
      if (!bearer) throw new Error('Not authenticated');
      setAdminBusy(phone10);
      const res = await fetch('/api/admin/admin-phones', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
        body: JSON.stringify(makeAdmin ? { add: phone10 } : { remove: phone10 }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      if (!res.ok || json?.success === false) throw new Error(json?.message || `HTTP ${res.status}`);
      if (json?.data) setAdminPhones(json.data);
    } catch (e: any) {
      setAdminError(e?.message || 'Failed to update admin access');
    } finally {
      setAdminBusy(null);
    }
  };

  const handleAddPhone = async () => {
    const p = last10(addPhone);
    if (!p) return;
    setAddPhone('');
    await toggleAdmin(p, true);
  };

  const visibleUsers = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      u.id.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.kyc_status.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <BackNavigation />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Users</h1>
          <p className="text-slate-400 mt-1">{total} total registered users</p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold">Team Admin Access</p>
        <p className="mt-2 text-sm text-slate-300">
          Add/remove admin access by phone number. Team members can open `https://www.assetforu.com/admin` and sign in with an admin phone.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={addPhone}
            onChange={(e) => setAddPhone(e.target.value)}
            placeholder="Add admin phone (10 digits)"
            className="flex-1 min-w-[220px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddPhone}
            className="px-4 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-bold hover:bg-primary-600 transition-colors"
          >
            Add Admin
          </button>
          <button
            type="button"
            onClick={() => void loadAdminPhones()}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm font-bold hover:bg-slate-700 transition-colors"
          >
            Refresh
          </button>
        </div>
        {adminPhones && (
          <p className="mt-3 text-xs text-slate-400">
            Admin phones: {adminPhones.all.length} total ({adminPhones.env.length} env, {adminPhones.dynamic.length} added here)
          </p>
        )}
        {adminError && <p className="mt-3 text-sm text-rose-400 font-semibold">{adminError}</p>}
      </div>

      <div className="mb-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, email, role, ID…"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary-700 focus:outline-none"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              {['ID', 'User', 'Phone', 'Email', 'Balance', 'KYC', 'Role', 'Joined', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={9} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-400 mx-auto" /></td></tr>
            ) : visibleUsers.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-slate-500">No users found.</td></tr>
            ) : visibleUsers.map(u => (
              (() => {
                const phone10 = last10(u.phone);
                const isAdmin = adminPhones ? adminPhones.all.includes(phone10) : u.role === 'admin';
                const isEnvAdmin = adminPhones ? adminPhones.env.includes(phone10) : false;
                const isDynamicAdmin = adminPhones ? adminPhones.dynamic.includes(phone10) : false;
                const busy = adminBusy === phone10;
                return (
              <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-5 py-4 text-slate-500 text-xs font-mono">{u.id}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-900 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{u.name || 'No name'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-300 text-sm font-mono">+91 {u.phone}</td>
                <td className="px-5 py-4 text-slate-300 text-sm">{u.email || '—'}</td>
                <td className="px-5 py-4 text-primary-400 font-black text-sm credit-number">₹{Number(u.balance || 0).toFixed(0)}</td>
                <td className="px-5 py-4">
                  <span className={clsx('badge', u.kyc_status === 'verified' ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400')}>
                    <ShieldCheck className="w-3 h-3" /> {u.kyc_status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={clsx('badge', isAdmin ? 'bg-purple-900/50 text-purple-400' : 'bg-slate-800 text-slate-400')}>
                    {isAdmin ? 'admin' : 'user'}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-400 text-xs">{format(new Date(u.created_at), 'dd MMM yyyy')}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewUser(u)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors"
                    >
                      View
                    </button>
                    {isEnvAdmin ? (
                      <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold">Env Admin</span>
                    ) : isAdmin ? (
                      <button
                        type="button"
                        disabled={!isDynamicAdmin || busy}
                        onClick={() => void toggleAdmin(phone10, false)}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                          !isDynamicAdmin || busy
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-rose-900/60 text-rose-300 hover:bg-rose-900'
                        )}
                      >
                        {busy ? 'Saving…' : 'Remove Admin'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy || !phone10}
                        onClick={() => void toggleAdmin(phone10, true)}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                          busy ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-primary-700 text-white hover:bg-primary-600'
                        )}
                      >
                        {busy ? 'Saving…' : 'Make Admin'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
                );
              })()
            ))}
          </tbody>
        </table>

        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <AdminJsonModal title="User" record={viewUser} onClose={() => setViewUser(null)} />
    </div>
  );
}
