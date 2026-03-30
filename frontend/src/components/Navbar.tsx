'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, useUIStore, useCartStore } from '@/store';
import { formatCurrency } from '@/lib/currency';
import { walletAPI } from '@/lib/api';
import { useEffect, useState } from 'react';
import {
  Leaf, ShoppingCart, Wallet, User, LogOut, Menu, X, ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/store', label: 'Store' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { openSignupModal, setWalletBalance, walletBalance, currency } = useUIStore();
  const { items } = useCartStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll shadow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Fetch wallet balance when logged in
  useEffect(() => {
    if (!user) return;
    walletAPI.get().then((r) => setWalletBalance(r.data.data.balance)).catch(() => {});
  }, [user, setWalletBalance]);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    window.location.assign('/');
  };

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 w-full border-b transition-all duration-200',
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-slate-200 shadow-sm'
          : 'bg-white border-primary-700/10'
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center shadow-primary group-hover:scale-105 transition-transform">
            <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-primary-700">AssetForU</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'nav-link pb-0.5 border-b-2 transition-all',
                pathname === link.href
                  ? 'border-primary-700 text-primary-700'
                  : 'border-transparent'
              )}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              href="/wallet"
              className={clsx(
                'nav-link pb-0.5 border-b-2 transition-all',
                pathname === '/wallet'
                  ? 'border-primary-700 text-primary-700'
                  : 'border-transparent'
              )}
            >
              Wallet
            </Link>
          )}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Wallet balance chip */}
              <Link
                href="/wallet"
                className="hidden md:flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-4 py-1.5 hover:bg-primary-100 transition-colors"
              >
                <Wallet className="w-4 h-4 text-primary-700" />
                <span className="text-sm font-bold text-primary-700 credit-number">
                  {formatCurrency(Number(walletBalance), currency)}
                </span>
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-slate-600" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-700 text-white text-[10px] font-bold flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Link>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors px-3 py-2"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden md:block text-sm font-semibold text-slate-700 max-w-[80px] truncate">
                    {user.name || user.phone}
                  </span>
                  <ChevronDown className={clsx('w-4 h-4 text-slate-500 transition-transform', profileOpen && 'rotate-180')} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-100 shadow-card-hover py-1 z-50 animate-fade-in">
                    <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors">
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <Link href="/wallet" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors">
                      <Wallet className="w-4 h-4" /> My Wallet
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-700 transition-colors">
                        ⚙️ Admin Panel
                      </Link>
                    )}
                    <div className="my-1 border-t border-slate-100" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => openSignupModal()}
              className="btn-primary py-2 px-5 text-sm"
            >
              Sign Up / Login
            </button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-1 animate-fade-in">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'block py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors',
                pathname === link.href
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link href="/wallet" onClick={() => setMobileOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Wallet — {formatCurrency(Number(walletBalance), currency)} credits
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
