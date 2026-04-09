'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { useEffect } from 'react';
import { Leaf, LayoutDashboard, Users, Megaphone, ShoppingBag, BarChart3, LogOut, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/admin/store', label: 'Store Items', icon: ShoppingBag },
  { href: '/admin/ads', label: 'Ads/Placements', icon: ImageIcon },
  { href: '/admin/transactions', label: 'Transactions', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoaded } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace('/login?next=/admin');
      return;
    }
    if (user.role !== 'admin') router.replace('/');
  }, [user, isLoaded, router]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight">AssetForU</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  active
                    ? 'bg-primary-700 text-white shadow-primary'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link href="/" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Site
          </Link>
          <button onClick={() => { logout(); router.push('/'); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-slate-950">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
