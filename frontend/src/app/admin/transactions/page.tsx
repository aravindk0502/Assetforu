'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import BackNavigation from '@/components/BackNavigation';

interface AdminTxn {
  id: string; phone: string; type: string; amount: number;
  credits: number; direction: string; description: string; status: string; created_at: string;
}

export default function AdminTransactionsPage() {
  const [txns, setTxns] = useState<AdminTxn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getTransactions().then(r => setTxns(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalRevenue = txns.filter(t => t.direction === 'credit' && t.type === 'credit_purchase').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div>
      <BackNavigation />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Transactions</h1>
          <p className="text-slate-400 mt-1">Total Revenue: <span className="text-green-400 font-black">₹{totalRevenue.toLocaleString()}</span></p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              {['User', 'Type', 'Amount (₹)', 'Credits', 'Description', 'Status', 'Date'].map(h => (
                <th key={h} className="px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-400 mx-auto" /></td></tr>
            ) : txns.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-500">No transactions yet.</td></tr>
            ) : txns.map(t => (
              <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-5 py-3.5 text-slate-300 text-sm font-mono">+91 {t.phone}</td>
                <td className="px-5 py-3.5">
                  <span className="badge bg-slate-800 text-slate-400 text-[10px]">{t.type.replace(/_/g,' ')}</span>
                </td>
                <td className="px-5 py-3.5 text-white font-semibold text-sm">₹{Number(t.amount).toFixed(0)}</td>
                <td className="px-5 py-3.5">
                  <span className={clsx('flex items-center gap-1 text-sm font-bold credit-number', t.direction === 'credit' ? 'text-green-400' : 'text-red-400')}>
                    {t.direction === 'credit' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    ₹{Number(t.credits).toFixed(0)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400 text-xs max-w-[180px] truncate">{t.description}</td>
                <td className="px-5 py-3.5">
                  <span className={clsx('badge text-[10px]', t.status === 'completed' ? 'bg-green-900/50 text-green-400' : 'bg-amber-900/50 text-amber-400')}>{t.status}</span>
                </td>
                <td className="px-5 py-3.5 text-slate-500 text-xs">{format(new Date(t.created_at), 'dd MMM yy, HH:mm')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
