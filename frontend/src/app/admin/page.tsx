'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import { Users, IndianRupee, Megaphone, TrendingUp, Loader2 } from 'lucide-react';
import BackNavigation from '@/components/BackNavigation';

interface Stats {
  total_users: number;
  total_transactions: number;
  active_campaigns: number;
  total_revenue_inr: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats().then(r => setStats(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = stats ? [
    { label: 'Total Users', value: stats.total_users.toLocaleString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-900/30' },
    { label: 'Total Transactions', value: stats.total_transactions.toLocaleString(), icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-900/30' },
    { label: 'Active Campaigns', value: stats.active_campaigns.toLocaleString(), icon: Megaphone, color: 'text-purple-400', bg: 'bg-purple-900/30' },
    { label: 'Total Revenue', value: `₹${stats.total_revenue_inr.toLocaleString()}`, icon: IndianRupee, color: 'text-amber-400', bg: 'bg-amber-900/30' },
  ] : [];

  return (
    <div>
      <BackNavigation />
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">AssetForU platform overview</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-slate-400 text-sm mb-1">{label}</p>
              <p className={`text-3xl font-black ${color} credit-number`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/campaigns', label: 'New Campaign', icon: '🎯' },
            { href: '/admin/store', label: 'Add Store Item', icon: '🛍️' },
            { href: '/admin/users', label: 'View Users', icon: '👥' },
            { href: '/admin/transactions', label: 'Transactions', icon: '💳' },
          ].map(({ href, label, icon }) => (
            <a key={href} href={href} className="flex items-center gap-3 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-semibold text-slate-300">
              <span className="text-xl">{icon}</span> {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
