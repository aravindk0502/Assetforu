'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { User, ShieldCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import BackNavigation from '@/components/BackNavigation';

interface AdminUser {
  id: string; phone: string; name?: string; email?: string;
  kyc_status: string; role: string; balance: number; created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    adminAPI.getUsers(page).then(r => { setUsers(r.data.data); setTotal(r.data.meta.total); }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <BackNavigation />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Users</h1>
          <p className="text-slate-400 mt-1">{total} total registered users</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              {['User', 'Phone', 'Balance', 'KYC', 'Role', 'Joined'].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-400 mx-auto" /></td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-900 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{u.name || 'No name'}</p>
                      {u.email && <p className="text-slate-500 text-xs">{u.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-300 text-sm font-mono">+91 {u.phone}</td>
                <td className="px-5 py-4 text-primary-400 font-black text-sm credit-number">₹{Number(u.balance || 0).toFixed(0)}</td>
                <td className="px-5 py-4">
                  <span className={clsx('badge', u.kyc_status === 'verified' ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400')}>
                    <ShieldCheck className="w-3 h-3" /> {u.kyc_status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={clsx('badge', u.role === 'admin' ? 'bg-purple-900/50 text-purple-400' : 'bg-slate-800 text-slate-400')}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-400 text-xs">{format(new Date(u.created_at), 'dd MMM yyyy')}</td>
              </tr>
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
    </div>
  );
}
